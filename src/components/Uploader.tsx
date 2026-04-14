import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, FileCode, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { extractTextFromPdf } from '../lib/pdf';
import { processStatement } from '../lib/gemini';
import { Transaction } from '../lib/types';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface UploaderProps {
  onTransactionsProcessed: (transactions: Transaction[]) => void;
}

export default function Uploader({ onTransactionsProcessed }: UploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
    }
  } as any);

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    let allNewTransactions: Transaction[] = [];

    try {
      for (const file of files) {
        let text = '';
        if (file.type === 'application/pdf') {
          text = await extractTextFromPdf(file);
        } else if (file.type === 'text/csv') {
          text = await new Promise((resolve) => {
            Papa.parse(file, {
              complete: (results) => {
                resolve(JSON.stringify(results.data));
              }
            });
          });
        }

        const transactions = await processStatement(text, useLocalModel);
        allNewTransactions = [...allNewTransactions, ...transactions];
      }

      onTransactionsProcessed(allNewTransactions);
      setFiles([]);
      toast.success("All statements processed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process some statements. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-dashed border-2 bg-white/50">
        <CardContent className="p-0">
          <div 
            {...getRootProps()} 
            className={`flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-colors ${
              isDragActive ? 'bg-black/5' : 'hover:bg-black/5'
            }`}
          >
            <input {...getInputProps()} />
            <div className="h-12 w-12 rounded-full bg-black/5 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-semibold">Upload Statements</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Drag and drop your bank or credit card statements here.<br />
              Supports PDF and CSV files.
            </p>
            <div className="mt-4 flex gap-2">
              <Badge variant="outline" className="bg-white">PDF</Badge>
              <Badge variant="outline" className="bg-white">CSV</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Selected Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  {file.type === 'application/pdf' ? (
                    <FileText className="h-5 w-5 text-rose-500" />
                  ) : (
                    <FileCode className="h-5 w-5 text-emerald-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeFile(i)}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 border-blue-100">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="local-model" className="text-sm font-medium text-blue-900">Local Privacy Mode</Label>
                <p className="text-[10px] text-blue-700">Use Ollama (Gemma 2) on your machine</p>
              </div>
              <Switch 
                id="local-model" 
                checked={useLocalModel} 
                onCheckedChange={setUseLocalModel}
                disabled={isProcessing}
              />
            </div>
            
            <Button 
              className="w-full mt-4 bg-black hover:bg-black/90 text-white" 
              onClick={processFiles}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing with {useLocalModel ? 'Local AI' : 'Gemini AI'}...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Process Statements
                </>
              )}
            </Button>
            
            <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle size={10} />
              {useLocalModel 
                ? "Statements are processed locally on your machine using Ollama."
                : "Statements are processed using Gemini AI to extract structured data."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

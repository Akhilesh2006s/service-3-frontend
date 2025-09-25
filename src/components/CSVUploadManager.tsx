import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet,
  Globe,
  Type,
  Volume2,
  BookOpen,
  Trash2,
  Eye,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSVUploadResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'dictation' | 'sentence-formation';
  size: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  recordsCount?: number;
}

const CSVUploadManager = () => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<'dictation' | 'sentence-formation'>('dictation');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample CSV templates
  const csvTemplates = {
    dictation: `telugu_word,english_meaning,difficulty
పాఠశాల,school,easy
ఇంటి,house,medium
పుస్తకం,book,hard`,
    
    'sentence-formation': `sentence_type,source_sentence,target_meaning,difficulty
en-te,I am going to school,నేను పాఠశాలకు వెళుతున్నాను,easy
en-te,Guests came to our house,మా ఇంటికి అతిథులు వచ్చారు,medium
te-en,నేను పాఠశాలకు వెళుతున్నాను,I am going to school,easy
te-en,మా ఇంటికి అతిథులు వచ్చారు,Guests came to our house,medium`
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create file object
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: selectedFileType,
        size: file.size,
        uploadedAt: new Date(),
        status: 'processing'
      };

      setUploadedFiles(prev => [uploadedFile, ...prev]);

      // Simulate file processing
      const result = await processCSVFile(file, selectedFileType);
      
      // Update file status
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: result.success ? 'completed' : 'error', recordsCount: result.data?.length }
          : f
      ));

      if (result.success) {
        toast({
          title: "Upload successful",
          description: `Successfully processed ${result.data?.length || 0} records from ${file.name}`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.message,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processCSVFile = async (file: File, type: string): Promise<CSVUploadResult> => {
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('exerciseType', type);

      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Upload failed',
          errors: result.errors
        };
      }

      return {
        success: true,
        message: result.message,
        data: result.data
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: "Network error occurred while uploading file"
      };
    }
  };

  const validateCSVData = (data: any[], type: string) => {
    const errors: string[] = [];
    
    switch (type) {
    case 'dictation':
      if (!data.every(row => row.telugu_word && row.english_meaning && row.difficulty)) {
        errors.push("All rows must have telugu_word, english_meaning, and difficulty columns");
      }
      break;
    case 'sentence-formation':
      if (!data.every(row => row.sentence_type && row.source_sentence && row.target_meaning && row.difficulty)) {
        errors.push("All rows must have sentence_type, source_sentence, target_meaning, and difficulty columns");
      }
      if (!data.every(row => ['en-te', 'te-en'].includes(row.sentence_type))) {
        errors.push("sentence_type must be either 'en-te' (English to Telugu) or 'te-en' (Telugu to English)");
      }
      break;
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? "Validation failed" : "Validation passed",
      errors
    };
  };

  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/csv-upload/template/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template downloaded",
        description: `CSV template for ${getFileTypeLabel(type)} has been downloaded.`,
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File removed",
      description: "The file has been removed from the list.",
    });
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'dictation':
        return <Volume2 className="h-4 w-4" />;
      case 'sentence-formation':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'dictation':
        return 'Telugu Dictation';
      case 'sentence-formation':
        return 'Telugu Vakya (Sentence Formation)';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload CSV Files</span>
          </CardTitle>
          <CardDescription>
            Upload CSV files to add new exercises for Telugu Dictation and Sentence Formation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="file-type">Exercise Type</Label>
            <Select value={selectedFileType} onValueChange={(value: any) => setSelectedFileType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select exercise type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dictation">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <span>Telugu Dictation</span>
                  </div>
                </SelectItem>
                <SelectItem value="sentence-formation">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Telugu Vakya (Sentence Formation)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="flex items-center space-x-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => downloadTemplate(selectedFileType)}
                disabled={isUploading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Template Preview */}
          <div className="space-y-2">
            <Label>CSV Template Preview</Label>
            <Textarea
              value={csvTemplates[selectedFileType]}
              readOnly
              className="h-32 font-mono text-sm"
              placeholder="CSV template will appear here..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Uploaded Files</span>
            </CardTitle>
            <CardDescription>
              Manage your uploaded CSV files and view their processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getFileTypeIcon(file.type)}
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-600">
                        {getFileTypeLabel(file.type)} • {(file.size / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-xs text-gray-500">
                        Uploaded: {file.uploadedAt.toLocaleString()}
                        {file.recordsCount && ` • ${file.recordsCount} records`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <Badge variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'error' ? 'destructive' :
                      file.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {file.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Telugu Dictation CSV Format:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <code>telugu_word</code>: The Telugu word for dictation</li>
              <li>• <code>english_meaning</code>: English translation for reference</li>
              <li>• <code>difficulty</code>: easy, medium, or hard</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Telugu Vakya (Sentence Formation) CSV Format:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <code>sentence_type</code>: "en-te" (English to Telugu) or "te-en" (Telugu to English)</li>
              <li>• <code>source_sentence</code>: The sentence to be formed (English or Telugu)</li>
              <li>• <code>target_meaning</code>: The translation for reference</li>
              <li>• <code>difficulty</code>: easy, medium, or hard</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The system will automatically break sentences into words and jumble them for the exercises. 
              Make sure your CSV file follows the exact format shown in the template.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVUploadManager;

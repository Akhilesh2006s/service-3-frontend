import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileText, 
  Globe,
  Type,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VakyaExercise {
  _id: string;
  sentenceType: 'te-en' | 'en-te';
  sourceSentence: string;
  targetMeaning: string;
  difficulty: 'easy' | 'medium' | 'hard';
  words: {
    original: string[];
    jumbled: string[];
    correctOrder: number[];
  };
  isActive: boolean;
  createdAt: string;
}

const TeluguVakyaManager = () => {
  const { toast } = useToast();
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [exerciseType, setExerciseType] = useState<'te-en' | 'en-te'>('te-en');
  const [isUploading, setIsUploading] = useState(false);
  const [exercises, setExercises] = useState<VakyaExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch exercises from backend
  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('telugu-basics-token');
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/exercises/sentence-formation', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Fetch exercises response status:', response.status);
      console.log('Fetch exercises response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Fetched exercises:', result);
        setExercises(result.data || []);
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch exercises:', response.status, errorResult);
        
        // If backend doesn't have the new model yet, use empty array
        if (response.status === 500 || response.status === 404) {
          console.log('Backend not updated yet, using empty exercises list');
          setExercises([]);
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load exercises on component mount
  useEffect(() => {
    fetchExercises();
  }, []);

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('exerciseType', exerciseType);

      const token = localStorage.getItem('telugu-basics-token');
      console.log('Uploading CSV:', {
        fileName: file.name,
        exerciseType,
        token: token ? 'Present' : 'Missing'
      });

      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);

      if (result.success) {
        // Check if no exercises were processed
        if (result.data.processedCount === 0) {
          toast({
            title: "Upload Failed",
            description: "No exercises were processed from the CSV file. The backend may not be updated with the new database model.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Upload Successful",
            description: `Successfully uploaded ${result.data.processedCount} exercises`,
          });
          // Refresh exercises list
          fetchExercises();
        }
        
        // Clear form
        setCsvFileName('');
        if (event.target) {
          event.target.value = '';
        }
      } else {
        console.error('Upload failed:', result);
        
        // Check if it's a backend model issue
        if (response.status === 500) {
          toast({
            title: "Backend Not Updated",
            description: "The backend needs to be updated with the new database model. Please contact the administrator.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Upload Failed",
            description: result.message || "Failed to upload CSV file",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: "Network error occurred while uploading file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    let template = '';
    let filename = '';
    
    if (exerciseType === 'te-en') {
      template = `telugu_sentence,english_meaning,difficulty
నేను పాఠశాలకు వెళుతున్నాను,I am going to school,easy
మా ఇంటికి అతిథులు వచ్చారు,Guests came to our house,medium
విద్యార్థులు పుస్తకాలు చదువుతున్నారు,Students are reading books,hard`;
      filename = 'telugu-to-english-template.csv';
    } else {
      template = `english_sentence,telugu_meaning,difficulty
I am going to school,నేను పాఠశాలకు వెళుతున్నాను,easy
Guests came to our house,మా ఇంటికి అతిథులు వచ్చారు,medium
Students are reading books,విద్యార్థులు పుస్తకాలు చదువుతున్నారు,hard`;
      filename = 'english-to-telugu-template.csv';
    }

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Backend Status Notice */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-yellow-800 font-medium">Backend Update Required</p>
              <p className="text-yellow-700 text-sm">
                The Railway backend needs to be updated with the new database model. 
                CSV uploads may not work until the backend is updated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Telugu Vakya (Sentence Formation)</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCSVUpload(!showCSVUpload)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showCSVUpload ? 'Hide CSV Upload' : 'Upload CSV'}
          </Button>
        </div>
      </div>

      {/* CSV Upload Section */}
      {showCSVUpload && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="w-5 h-5" />
              Upload CSV Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exercise Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="exercise-type">Exercise Type</Label>
              <Select value={exerciseType} onValueChange={(value: any) => setExerciseType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="te-en">
                    <div className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Telugu to English</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="en-te">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>English to Telugu</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <div className="flex gap-2">
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="flex-1"
                />
                <Button
                  onClick={downloadCSVTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Template
                </Button>
              </div>
              {csvFileName && (
                <p className="text-sm text-green-600">✓ {csvFileName} loaded</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                {exerciseType === 'te-en' ? 'Telugu to English' : 'English to Telugu'} CSV Format:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {exerciseType === 'te-en' ? (
                  <>
                    <li>• <strong>telugu_sentence</strong>: Telugu sentence to be formed (required)</li>
                    <li>• <strong>english_meaning</strong>: English translation for reference (required)</li>
                    <li>• <strong>difficulty</strong>: easy, medium, or hard (required)</li>
                  </>
                ) : (
                  <>
                    <li>• <strong>english_sentence</strong>: English sentence to be formed (required)</li>
                    <li>• <strong>telugu_meaning</strong>: Telugu translation for reference (required)</li>
                    <li>• <strong>difficulty</strong>: easy, medium, or hard (required)</li>
                  </>
                )}
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                Download the template above to see the exact format.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Exercises</p>
                <p className="text-2xl font-bold text-gray-900">{exercises.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Type className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{exercises.filter(e => e.isActive).length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Telugu to English</p>
                <p className="text-2xl font-bold text-purple-600">{exercises.filter(e => e.sentenceType === 'te-en').length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Type className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">English to Telugu</p>
                <p className="text-2xl font-bold text-orange-600">{exercises.filter(e => e.sentenceType === 'en-te').length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Exercise Management
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchExercises}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by sentence content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Exercise Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="te-en">Telugu to English</SelectItem>
                <SelectItem value="en-te">English to Telugu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercises List */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Showing {exercises.filter(exercise => {
                const matchesSearch = exercise.sourceSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    exercise.targetMeaning.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = selectedType === 'all' || exercise.sentenceType === selectedType;
                const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
                return matchesSearch && matchesType && matchesDifficulty;
              }).length} of {exercises.length} exercises
            </p>

            {exercises
              .filter(exercise => {
                const matchesSearch = exercise.sourceSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    exercise.targetMeaning.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = selectedType === 'all' || exercise.sentenceType === selectedType;
                const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
                return matchesSearch && matchesType && matchesDifficulty;
              })
              .map((exercise) => (
                <Card key={exercise._id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={exercise.sentenceType === 'te-en' ? 'default' : 'secondary'}>
                            {exercise.sentenceType === 'te-en' ? 'Telugu to English' : 'English to Telugu'}
                          </Badge>
                          <Badge variant="outline">{exercise.difficulty}</Badge>
                          <Badge variant={exercise.isActive ? 'default' : 'secondary'}>
                            {exercise.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">
                          {exercise.sentenceType === 'te-en' ? 'Telugu' : 'English'}: {exercise.sourceSentence}
                        </p>
                        <p className="text-sm text-gray-600">
                          {exercise.sentenceType === 'te-en' ? 'English' : 'Telugu'}: {exercise.targetMeaning}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(exercise.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeluguVakyaManager;
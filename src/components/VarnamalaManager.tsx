import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  FileText, 
  Type,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VarnamalaExercise {
  _id: string;
  teluguWord: string;
  englishMeaning: string;
  difficulty: 'easy' | 'medium' | 'hard';
  letters: {
    original: string[];
    jumbled: string[];
    correctOrder: number[];
    randomLetters: string[];
  };
  isActive: boolean;
  createdAt: string;
}

const VarnamalaManager: React.FC = () => {
  const [exercises, setExercises] = useState<VarnamalaExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const { toast } = useToast();

  // Fetch exercises from backend
  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('telugu-basics-token');
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/exercises/varnamala?limit=100', {
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
      formData.append('exerciseType', 'varnamala');

      const token = localStorage.getItem('telugu-basics-token');
      console.log('Uploading CSV:', {
        fileName: file.name,
        exerciseType: 'varnamala',
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
          // Force refresh exercises list
          setTimeout(() => {
            fetchExercises();
          }, 1000);
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

  const downloadCSVTemplate = async () => {
    try {
      const token = localStorage.getItem('telugu-basics-token');
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/template/varnamala', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'varnamala-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download template",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Network error occurred while downloading template",
        variant: "destructive"
      });
    }
  };

  // Filter exercises based on search and difficulty
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchTerm === '' || 
      exercise.teluguWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.englishMeaning.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesDifficulty;
  });

  // Calculate statistics
  const totalExercises = exercises.length;
  const activeExercises = exercises.filter(ex => ex.isActive).length;
  const easyExercises = exercises.filter(ex => ex.difficulty === 'easy').length;
  const mediumExercises = exercises.filter(ex => ex.difficulty === 'medium').length;
  const hardExercises = exercises.filter(ex => ex.difficulty === 'hard').length;

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
        <h1 className="text-3xl font-bold text-gray-900">Varnamala (Alphabet) Exercises</h1>
        <div className="flex gap-2">
          <Button
            onClick={downloadCSVTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Template
          </Button>
        </div>
      </div>

      {/* Upload CSV Files */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-700">Upload CSV Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-upload" className="text-sm font-medium text-gray-700">
              Upload CSV File
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isUploading}
                className="flex-1"
              />
              <Button
                onClick={downloadCSVTemplate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Template
              </Button>
            </div>
          </div>

          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Varnamala CSV Format:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><code>telugu_word</code>: Telugu word to be formed (required)</p>
              <p><code>english_meaning</code>: English translation for reference (required)</p>
              <p><code>difficulty</code>: easy, medium, or hard (required)</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Download the template above to see the exact format.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Type className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">{totalExercises}</p>
            <p className="text-sm text-green-600">Total Exercises</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{activeExercises}</p>
            <p className="text-sm text-blue-600">Active</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Type className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">{easyExercises + mediumExercises}</p>
            <p className="text-sm text-yellow-600">Easy & Medium</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Type className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-700">{hardExercises}</p>
            <p className="text-sm text-red-600">Hard</p>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Management */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-purple-700">
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
              <Button
                onClick={() => {
                  fetchExercises();
                  toast({
                    title: "Refreshed",
                    description: "Exercise list has been refreshed",
                  });
                }}
                variant="default"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Force Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by word content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Showing {filteredExercises.length} of {exercises.length} exercises
          </p>

          {filteredExercises
            .map((exercise) => (
              <Card key={exercise._id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${
                          exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {exercise.difficulty}
                        </Badge>
                        <Badge variant={exercise.isActive ? 'default' : 'secondary'}>
                          {exercise.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {exercise.teluguWord}
                      </h3>
                      <p className="text-gray-600 mb-2">{exercise.englishMeaning}</p>
                      <div className="text-sm text-gray-500">
                        <p>Letters: {exercise.letters.original.join(', ')}</p>
                        <p>Random letters: {exercise.letters.randomLetters.join(', ')}</p>
                        <p>Created: {new Date(exercise.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default VarnamalaManager;

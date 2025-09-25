import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Upload, RotateCcw, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface HandwritingExercise {
  _id: string;
  teluguWord: string;
  englishMeaning: string;
  difficulty: string;
  audioUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function HandwritingManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [exercises, setExercises] = useState<HandwritingExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleCSVUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('exerciseType', 'handwriting');

      const token = localStorage.getItem('telugu-basics-token');
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Upload response:', response.status, result);

      if (response.ok && result.success) {
        toast({
          title: "Upload Successful",
          description: `${result.data.processedCount} handwriting exercises uploaded successfully.`,
        });
        setSelectedFile(null);
        fetchExercises();
      } else {
        toast({
          title: "Upload Failed",
          description: result.message || "Failed to upload CSV file.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('telugu-basics-token');
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/template/handwriting', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'handwriting-template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Template Downloaded",
          description: "Handwriting template CSV file downloaded successfully.",
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download template file.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "An error occurred while downloading the template.",
        variant: "destructive"
      });
    }
  };

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('telugu-basics-token');
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/exercises/handwriting?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExercises(result.data || []);
        }
      } else {
        console.log('Failed to fetch exercises:', response.status, response.statusText);
        setExercises([]);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setExercises([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.teluguWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.englishMeaning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const stats = {
    total: exercises.length,
    active: exercises.filter(e => e.isActive).length,
    easy: exercises.filter(e => e.difficulty === 'easy').length,
    medium: exercises.filter(e => e.difficulty === 'medium').length,
    hard: exercises.filter(e => e.difficulty === 'hard').length,
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Handwriting Exercises Management</h2>
        <p className="text-gray-600">Upload and manage Telugu handwriting exercises</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Handwriting Exercises
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-green-600">Selected: {selectedFile.name}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCSVUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
            
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>CSV Format:</strong> telugu_word, english_meaning, difficulty</p>
            <p><strong>Difficulty:</strong> easy, medium, hard</p>
            <p><strong>Example:</strong> కమలం,lotus,easy</p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.easy}</div>
            <div className="text-sm text-gray-600">Easy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
            <div className="text-sm text-gray-600">Medium</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.hard}</div>
            <div className="text-sm text-gray-600">Hard</div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Handwriting Exercises</CardTitle>
            <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex items-center gap-2"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise Table */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8">Loading exercises...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No handwriting exercises found.
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <div
                  key={exercise._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold text-lg">{exercise.teluguWord}</div>
                        <div className="text-sm text-gray-600">{exercise.englishMeaning}</div>
                      </div>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                      <Badge variant={exercise.isActive ? "default" : "secondary"}>
                        {exercise.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

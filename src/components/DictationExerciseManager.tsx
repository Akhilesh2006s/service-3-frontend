import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Volume2,
  BookOpen,
  Target,
  Users,
  Upload,
  Download,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Word {
  word: string;
  meaning: string;
  pronunciation: string;
}

interface DictationExercise {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' | 'expert';
  words: Word[];
  totalWords: number;
  isPublished: boolean;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CSVRow {
  difficulty: string;
  word: string;
  pronunciation: string;
}

const DictationExerciseManager = () => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<DictationExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<DictationExercise | null>(null);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard' | 'very_hard' | 'expert',
    words: [{ word: '', meaning: '', pronunciation: '' }] as Word[]
  });

  // Load exercises on component mount
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/dictation-exercises', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExercises(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load dictation exercises",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'easy',
      words: [{ word: '', meaning: '', pronunciation: '' }]
    });
    setEditingExercise(null);
    setShowCreateForm(false);
  };

  const addWord = () => {
    setFormData(prev => ({
      ...prev,
      words: [...prev.words, { word: '', meaning: '', pronunciation: '' }]
    }));
  };

  const removeWord = (index: number) => {
    if (formData.words.length > 1) {
      setFormData(prev => ({
        ...prev,
        words: prev.words.filter((_, i) => i !== index)
      }));
    }
  };

  const updateWord = (index: number, field: keyof Word, value: string) => {
    setFormData(prev => ({
      ...prev,
      words: prev.words.map((word, i) => 
        i === index ? { ...word, [field]: value } : word
      )
    }));
  };

  // CSV Upload Functions
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setCsvFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV must have header row and at least one data row",
          variant: "destructive"
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['difficulty', 'word'];
      
      // Check if all required headers are present
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast({
          title: "Missing Headers",
          description: `Missing required headers: ${missingHeaders.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

             const data: CSVRow[] = [];
       for (let i = 1; i < lines.length; i++) {
         const values = lines[i].split(',').map(v => v.trim());
         if (values.length < 2) continue; // Skip empty rows (need at least difficulty and word)
         
         const row: CSVRow = {
           difficulty: values[headers.indexOf('difficulty')] || 'easy',
           word: values[headers.indexOf('word')] || '',
           pronunciation: values[headers.indexOf('pronunciation')] || ''
         };
         
         if (row.word) {
           data.push(row);
         }
       }

      if (data.length === 0) {
        toast({
          title: "No Valid Data",
          description: "No valid rows found in CSV",
          variant: "destructive"
        });
        return;
      }

      setCsvData(data);
      toast({
        title: "CSV Loaded",
        description: `Successfully loaded ${data.length} words from CSV`,
      });

    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive"
      });
    }
  };

  const processCSVData = () => {
    if (csvData.length === 0) return;

    // Group by difficulty to create exercises
    const exerciseGroups = new Map<string, CSVRow[]>();
    
    csvData.forEach(row => {
      const key = row.difficulty;
      if (!exerciseGroups.has(key)) {
        exerciseGroups.set(key, []);
      }
      exerciseGroups.get(key)!.push(row);
    });

    // Create exercises from groups
    const exercisesToCreate = Array.from(exerciseGroups.entries()).map(([difficulty, rows]) => {
      return {
        title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level Words`,
        description: `Practice ${difficulty} level Telugu words`,
        difficulty: difficulty as 'easy' | 'medium' | 'hard' | 'very_hard' | 'expert',
        words: rows.map(row => ({
          word: row.word,
          meaning: '',
          pronunciation: row.pronunciation
        }))
      };
    });

    // Create exercises
    createExercisesFromCSV(exercisesToCreate);
  };

  const createExercisesFromCSV = async (exercises: any[]) => {
    try {
      setIsLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const exercise of exercises) {
        try {
          const response = await fetch('http://localhost:5000/api/dictation-exercises', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(exercise)
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error('Error creating exercise:', error);
        }
      }

      toast({
        title: "CSV Import Complete",
        description: `Successfully created ${successCount} exercises${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      // Reset CSV data and reload exercises
      setCsvData([]);
      setCsvFileName('');
      setShowCSVUpload(false);
      loadExercises();

    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to process CSV data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const template = `difficulty,word,pronunciation
easy,నమస్కారం,namaskaram
easy,ధన్యవాదాలు,dhanyavaadalu
medium,మీరు ఎలా ఉన్నారు,meeru ela unnaru
medium,నేను బాగా ఉన్నాను,nenu baaga unnaanu
hard,విద్యార్థి,vidyaarthi
hard,ఉపాధ్యాయుడు,upaadhyayudu`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dictation_exercises_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    // Validate words
    const validWords = formData.words.filter(w => w.word.trim() !== '');
    if (validWords.length === 0) {
      toast({
        title: "No Words",
        description: "Please add at least one word",
        variant: "destructive"
      });
      return;
    }

    try {
      const url = editingExercise 
        ? `http://localhost:5000/api/dictation-exercises/${editingExercise._id}`
        : 'http://localhost:5000/api/dictation-exercises';
      
      const method = editingExercise ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          words: validWords
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Success",
            description: editingExercise 
              ? "Dictation exercise updated successfully"
              : "Dictation exercise created successfully"
          });
          resetForm();
          loadExercises();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save exercise",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast({
        title: "Error",
        description: "Failed to save dictation exercise",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (exercise: DictationExercise) => {
    setEditingExercise(exercise);
    setFormData({
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty,
      words: exercise.words.length > 0 ? exercise.words : [{ word: '', meaning: '', pronunciation: '' }]
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dictation exercise?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/dictation-exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Dictation exercise deleted successfully"
        });
        loadExercises();
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete dictation exercise",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/dictation-exercises/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !isPublished })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Dictation exercise ${!isPublished ? 'published' : 'unpublished'} successfully`
        });
        loadExercises();
      }
    } catch (error) {
      console.error('Error publishing exercise:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise status",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'very_hard': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      case 'very_hard': return 'Very Hard';
      case 'expert': return 'Expert';
      default: return difficulty;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dictation Exercise Manager</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCSVUpload(!showCSVUpload)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showCSVUpload ? 'Hide CSV Upload' : 'Upload CSV'}
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Hide Form' : 'Create Exercise'}
          </Button>
        </div>
      </div>

      {/* CSV Upload Section */}
      {showCSVUpload && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="w-5 h-5" />
              CSV Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {csvData.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Preview ({csvData.length} words)</h3>
                  <Button
                    onClick={processCSVData}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isLoading ? 'Creating...' : 'Create Exercises'}
                  </Button>
                </div>
                
                                 <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-white">
                   <table className="w-full text-sm">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="text-left p-2">Difficulty</th>
                         <th className="text-left p-2">Word</th>
                         <th className="text-left p-2">Pronunciation</th>
                       </tr>
                     </thead>
                     <tbody>
                       {csvData.slice(0, 10).map((row, index) => (
                         <tr key={index} className="border-t">
                           <td className="p-2">
                             <Badge variant="outline">{row.difficulty}</Badge>
                           </td>
                           <td className="p-2 font-medium">{row.word}</td>
                           <td className="p-2 text-gray-600">{row.pronunciation}</td>
                         </tr>
                       ))}
                       {csvData.length > 10 && (
                         <tr>
                           <td colSpan={3} className="p-2 text-center text-gray-500">
                             ... and {csvData.length - 10} more words
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}

                         <div className="bg-blue-50 p-4 rounded-lg">
               <h4 className="font-semibold text-blue-800 mb-2">CSV Format Instructions:</h4>
               <ul className="text-sm text-blue-700 space-y-1">
                 <li>• <strong>difficulty</strong>: easy, medium, hard, very_hard, expert (required)</li>
                 <li>• <strong>word</strong>: Telugu word (required)</li>
                 <li>• <strong>pronunciation</strong>: Pronunciation guide (optional)</li>
                 <li>• Words with same difficulty will be grouped into one exercise</li>
                 <li>• Exercise title will be automatically generated as "[Difficulty] Level Words"</li>
               </ul>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {editingExercise ? 'Edit Dictation Exercise' : 'Create New Dictation Exercise'}
              </span>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exercise Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Basic Telugu Vowels"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level *</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="very_hard">Very Hard</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this exercise covers..."
                  rows={3}
                  required
                />
              </div>

              {/* Words Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Words ({formData.words.filter(w => w.word.trim()).length})</Label>
                  <Button type="button" onClick={addWord} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Word
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.words.map((word, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Telugu Word *</Label>
                        <Input
                          value={word.word}
                          onChange={(e) => updateWord(index, 'word', e.target.value)}
                          placeholder="అమ్మ"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Meaning (Optional)</Label>
                        <Input
                          value={word.meaning}
                          onChange={(e) => updateWord(index, 'meaning', e.target.value)}
                          placeholder="Mother"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pronunciation (Optional)</Label>
                        <Input
                          value={word.pronunciation}
                          onChange={(e) => updateWord(index, 'pronunciation', e.target.value)}
                          placeholder="amma"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={() => removeWord(index)}
                          variant="outline"
                          size="sm"
                          disabled={formData.words.length === 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingExercise ? 'Update Exercise' : 'Create Exercise'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Dictation Exercises</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading exercises...</p>
          </div>
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No Dictation Exercises</h4>
              <p className="text-gray-600 mb-4">Create your first dictation exercise to get started</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exercises.map((exercise) => (
              <Card key={exercise._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{exercise.title}</h4>
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {getDifficultyLabel(exercise.difficulty)}
                        </Badge>
                        <Badge variant={exercise.isPublished ? "default" : "secondary"}>
                          {exercise.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{exercise.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {exercise.totalWords} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          By {exercise.createdBy.name}
                        </span>
                        <span>
                          Created: {new Date(exercise.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Preview of first few words */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">Sample words:</p>
                        <div className="flex flex-wrap gap-2">
                          {exercise.words.slice(0, 5).map((word, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {word.word}
                            </Badge>
                          ))}
                          {exercise.words.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{exercise.words.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(exercise)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      
                      <Button
                        variant={exercise.isPublished ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handlePublish(exercise._id, exercise.isPublished)}
                        className="flex items-center gap-2"
                      >
                        {exercise.isPublished ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Publish
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(exercise._id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DictationExerciseManager;

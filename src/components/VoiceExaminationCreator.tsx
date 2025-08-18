import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  Target, 
  Tag, 
  Save, 
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VoiceExaminationCreatorProps {
  onCreated: (examination: any) => void;
  onCancel: () => void;
}

const VoiceExaminationCreator: React.FC<VoiceExaminationCreatorProps> = ({
  onCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    teluguTitle: '',
    paragraph: '',
    teluguParagraph: '',
    instructions: '',
    teluguInstructions: '',
    timeLimit: 300, // 5 minutes default
    maxScore: 100,
    passingScore: 70,
    difficulty: 'medium',
    category: 'reading',
    tags: [] as string[],
    expiresAt: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');

  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const calculateReadingTime = (wordCount: number) => {
    // Average 150 words per minute for Telugu
    return Math.ceil((wordCount / 150) * 60);
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.teluguTitle.trim()) return 'Telugu title is required';
    if (!formData.paragraph.trim()) return 'Paragraph is required';
    if (!formData.teluguParagraph.trim()) return 'Telugu paragraph is required';
    if (!formData.instructions.trim()) return 'Instructions are required';
    if (!formData.teluguInstructions.trim()) return 'Telugu instructions are required';
    if (formData.timeLimit < 60) return 'Time limit must be at least 1 minute';
    if (formData.timeLimit > 1800) return 'Time limit cannot exceed 30 minutes';
    if (formData.maxScore < 1 || formData.maxScore > 100) return 'Max score must be between 1 and 100';
    if (formData.passingScore < 1 || formData.passingScore > 100) return 'Passing score must be between 1 and 100';
    if (formData.passingScore > formData.maxScore) return 'Passing score cannot exceed max score';
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('telugu-basics-token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('https://service-3-backend-production.up.railway.app/api/voice-examinations/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create examination');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Voice examination created successfully!",
      });

      onCreated(result.data);
    } catch (error) {
      console.error('Error creating voice examination:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create examination',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = calculateWordCount(formData.paragraph);
  const estimatedReadingTime = calculateReadingTime(wordCount);

  if (previewMode) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Preview: {formData.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{formData.difficulty}</Badge>
              <Badge variant="outline">{formData.category}</Badge>
              <Button
                onClick={() => setPreviewMode(false)}
                variant="outline"
                size="sm"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Edit Mode
              </Button>
            </div>
          </div>
          <p className="text-primary font-medium">{formData.teluguTitle}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Instructions:</h3>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">{formData.instructions}</p>
              <p className="text-sm text-primary">{formData.teluguInstructions}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Reading Paragraph:</h3>
            <div className="p-6 bg-gray-50 rounded-lg border-2 border-primary/20">
              <p className="text-lg leading-relaxed mb-4">{formData.paragraph}</p>
              <p className="text-lg leading-relaxed text-primary font-medium">{formData.teluguParagraph}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{wordCount}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{estimatedReadingTime}s</div>
              <div className="text-sm text-gray-600">Est. Reading Time</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{formData.timeLimit}s</div>
              <div className="text-sm text-gray-600">Time Limit</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{formData.maxScore}</div>
              <div className="text-sm text-gray-600">Max Score</div>
            </div>
          </div>

          {formData.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              Back to Edit
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Examination
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create Voice Examination</CardTitle>
        <p className="text-muted-foreground">
          Create a new voice examination for students to practice reading and pronunciation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (English)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter examination title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teluguTitle">Title (Telugu)</Label>
            <Input
              id="teluguTitle"
              value={formData.teluguTitle}
              onChange={(e) => handleInputChange('teluguTitle', e.target.value)}
              placeholder="తెలుగులో శీర్షిక"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (English)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Enter instructions for students"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teluguInstructions">Instructions (Telugu)</Label>
            <Textarea
              id="teluguInstructions"
              value={formData.teluguInstructions}
              onChange={(e) => handleInputChange('teluguInstructions', e.target.value)}
              placeholder="విద్యార్థులకు సూచనలు"
              rows={3}
            />
          </div>
        </div>

        {/* Paragraph */}
        <div className="space-y-2">
          <Label htmlFor="paragraph">Reading Paragraph (English)</Label>
          <Textarea
            id="paragraph"
            value={formData.paragraph}
            onChange={(e) => handleInputChange('paragraph', e.target.value)}
            placeholder="Enter the paragraph for students to read"
            rows={6}
          />
          <div className="text-sm text-muted-foreground">
            Word count: {wordCount} | Estimated reading time: {estimatedReadingTime} seconds
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teluguParagraph">Reading Paragraph (Telugu)</Label>
          <Textarea
            id="teluguParagraph"
            value={formData.teluguParagraph}
            onChange={(e) => handleInputChange('teluguParagraph', e.target.value)}
            placeholder="విద్యార్థులు చదవడానికి పేరా"
            rows={6}
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={formData.timeLimit}
              onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 300)}
              min={60}
              max={1800}
            />
            <div className="text-sm text-muted-foreground">
              Min: 60s, Max: 1800s (30 min)
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxScore">Maximum Score</Label>
            <Input
              id="maxScore"
              type="number"
              value={formData.maxScore}
              onChange={(e) => handleInputChange('maxScore', parseInt(e.target.value) || 100)}
              min={1}
              max={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passingScore">Passing Score</Label>
            <Input
              id="passingScore"
              type="number"
              value={formData.passingScore}
              onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value) || 70)}
              min={1}
              max={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="pronunciation">Pronunciation</SelectItem>
                <SelectItem value="fluency">Fluency</SelectItem>
                <SelectItem value="comprehension">Comprehension</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button onClick={handleAddTag} variant="outline" size="sm">
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Expiration Date */}
        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => handleInputChange('expiresAt', e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            Leave empty if the examination should not expire
          </div>
        </div>

        {/* Validation Alert */}
        {(() => {
          const error = validateForm();
          if (error) {
            return (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={() => setPreviewMode(true)} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !!validateForm()}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Examination
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceExaminationCreator;




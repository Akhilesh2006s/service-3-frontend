import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  FileText, 
  Image, 
  Mic, 
  Upload,
  Play,
  Pause,
  Volume2,
  BookOpen,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TeluguStory {
  _id?: string;
  title: string;
  teluguTitle: string;
  content: string;
  teluguContent: string;
  category: "historical" | "virtuous" | "educational" | "cultural" | "moral";
  difficulty: "easy" | "medium" | "hard";
  milestone: number;
  wordCount: number;
  photos: Array<{
    url: string;
    caption: string;
    teluguCaption: string;
    order: number;
  }>;
  paragraphs: Array<{
    content: string;
    teluguContent: string;
    order: number;
    hasAudio: boolean;
    audioUrl?: string;
  }>;
  audioUrl?: string;
  tags: string[];
  readingTime: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TeluguStoryManagerProps {
  currentMilestone?: number;
}

const TeluguStoryManager = ({ currentMilestone = 1 }: TeluguStoryManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("add-story");
  const [stories, setStories] = useState<TeluguStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<TeluguStory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    teluguTitle: "",
    teluguContent: "",
    difficulty: "medium" as TeluguStory["difficulty"],
    tags: ""
  });

  // File uploads - removed photos functionality
  
  // Paragraphs
  const [paragraphs, setParagraphs] = useState<Array<{
    content: string;
    teluguContent: string;
    order: number;
    hasAudio: boolean;
    audioUrl?: string;
  }>>([]);



  // File input ref removed - photos functionality removed

  // Load stories on component mount
  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/telugu-stories/trainer/my-stories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories);
      } else {
        throw new Error('Failed to fetch stories');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Photo handling functions removed

  const addParagraph = () => {
    setParagraphs(prev => [...prev, {
      content: "",
      teluguContent: "",
      order: prev.length,
      hasAudio: false
    }]);
  };

  const updateParagraph = (index: number, field: string, value: string | boolean) => {
    setParagraphs(prev => prev.map((para, i) => 
      i === index ? { ...para, [field]: value } : para
    ));
  };

  const removeParagraph = (index: number) => {
    setParagraphs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teluguTitle || !formData.teluguContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in Telugu title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      
      // Add basic story data with default values for removed fields
      formDataToSend.append('title', formData.teluguTitle); // Use Telugu title as English title
      formDataToSend.append('teluguTitle', formData.teluguTitle);
      formDataToSend.append('content', formData.teluguContent); // Use Telugu content as English content
      formDataToSend.append('teluguContent', formData.teluguContent);
      formDataToSend.append('category', 'educational'); // Default category
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('milestone', currentMilestone.toString()); // Use current milestone
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('readingTime', '5'); // Default reading time
      
      // Add empty photos array
      formDataToSend.append('photos', '[]');
      
      // Add paragraphs
      formDataToSend.append('paragraphs', JSON.stringify(paragraphs));

      const url = isEditing && selectedStory?._id 
        ? `http://localhost:5000/api/telugu-stories/${selectedStory._id}`
        : 'http://localhost:5000/api/telugu-stories';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: isEditing ? "Story updated successfully" : "Story created successfully"
        });
        
        // Reset form
        resetForm();
        fetchStories();
        setActiveTab("my-stories");
      } else {
        throw new Error('Failed to save story');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save story",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      teluguTitle: "",
      teluguContent: "",
      difficulty: "medium",
      tags: ""
    });
    setParagraphs([]);
    setSelectedStory(null);
    setIsEditing(false);
  };

  const editStory = (story: TeluguStory) => {
    setSelectedStory(story);
    setFormData({
      title: story.title,
      teluguTitle: story.teluguTitle,
      content: story.content,
      teluguContent: story.teluguContent,
      category: story.category,
      difficulty: story.difficulty,
      milestone: story.milestone,
      tags: story.tags.join(', '),
      readingTime: story.readingTime
    });
    setParagraphs(story.paragraphs);
    setIsEditing(true);
    setActiveTab("add-story");
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/telugu-stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Story deleted successfully"
        });
        fetchStories();
      } else {
        throw new Error('Failed to delete story');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive"
      });
    }
  };



  const getCategoryColor = (category: string) => {
    switch (category) {
      case "historical": return "bg-blue-100 text-blue-800";
      case "virtuous": return "bg-green-100 text-green-800";
      case "educational": return "bg-purple-100 text-purple-800";
      case "cultural": return "bg-orange-100 text-orange-800";
      case "moral": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">తెలుగు కథలు నిర్వహణ</h2>
                     <p className="text-muted-foreground">
             Manage Telugu stories with photos and paragraphs. Audio reading is automatic.
           </p>
        </div>
        <Button onClick={() => setActiveTab("add-story")} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Story
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-story" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {isEditing ? "Edit Story" : "Add Story"}
          </TabsTrigger>
          <TabsTrigger value="my-stories" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Stories ({stories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add-story" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {isEditing ? "Edit Telugu Story" : "Add New Telugu Story"}
              </CardTitle>
                             <CardDescription>
                 Create a new Telugu story. Audio reading is automatic.
               </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="teluguTitle">తెలుగు శీర్షిక</Label>
                  <Input
                    id="teluguTitle"
                    value={formData.teluguTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, teluguTitle: e.target.value }))}
                    placeholder="కథ శీర్షికను తెలుగులో నమోదు చేయండి"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teluguContent">తెలుగు విషయం</Label>
                  <Textarea
                    id="teluguContent"
                    value={formData.teluguContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, teluguContent: e.target.value }))}
                    placeholder="కథ విషయాన్ని తెలుగులో నమోదు చేయండి"
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., telugu, culture, history"
                  />
                </div>

                {/* Photos section removed */}

                

                {/* Paragraphs Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Paragraphs</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addParagraph}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Paragraph
                    </Button>
                  </div>

                  {paragraphs.map((paragraph, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Paragraph {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeParagraph(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>English Content</Label>
                            <Textarea
                              value={paragraph.content}
                              onChange={(e) => updateParagraph(index, 'content', e.target.value)}
                              placeholder="Enter paragraph content in English"
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>తెలుగు విషయం</Label>
                            <Textarea
                              value={paragraph.teluguContent}
                              onChange={(e) => updateParagraph(index, 'teluguContent', e.target.value)}
                              placeholder="పేరా విషయాన్ని తెలుగులో నమోదు చేయండి"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEditing ? "Update Story" : "Create Story"}
                      </>
                    )}
                  </Button>
                  
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-stories" className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Loading stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Stories Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any Telugu stories yet.
                </p>
                <Button onClick={() => setActiveTab("add-story")} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Story
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {stories.map((story) => (
                <Card key={story._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{story.teluguTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground">{story.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(story.category)}>
                            {story.category}
                          </Badge>
                          <Badge className={getDifficultyColor(story.difficulty)}>
                            {story.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            Milestone {story.milestone}
                          </Badge>
                          <Badge variant="outline">
                            {story.wordCount} words
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editStory(story)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStory(story._id!)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {story.teluguContent}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          {story.photos.length} photos
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {story.paragraphs.length} paragraphs
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {story.readingTime} min read
                        </span>
                      </div>

                      
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      
    </div>
  );
};

export default TeluguStoryManager;

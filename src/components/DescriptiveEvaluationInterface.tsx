import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Eye, 
  Star,
  CheckCircle,
  AlertCircle,
  Send,
  Clock,
  User,
  BookOpen,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DescriptiveSubmission {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  exam: {
    _id: string;
    title: string;
    type: string;
    milestone: number;
  };
  descriptiveAnswers: Array<{
    questionIndex: number;
    question?: string;
    textAnswer?: string;
    pdfUrl?: string;
    fileName?: string;
    fileSize?: number;
    submittedAt: Date;
  }>;
  status: 'pending' | 'evaluated' | 'approved' | 'rejected';
  submittedAt: Date;
  evaluation?: {
    evaluatedBy: string;
    evaluatedAt: Date;
    contentScore: number;
    grammarScore: number;
    structureScore: number;
    overallScore: number;
    feedback: string;
    tags: string[];
    suggestions: string[];
  };
}

interface DescriptiveQuestion {
  question: string;
  instructions: string;
  maxPoints: number;
  wordLimit?: number;
}

interface DescriptiveEvaluationInterfaceProps {
  submission: DescriptiveSubmission;
  questions: DescriptiveQuestion[];
  onEvaluate: (evaluation: any) => void;
  onClose?: () => void;
  isEvaluated?: boolean;
  examMaxMarks?: number;
}

const DescriptiveEvaluationInterface: React.FC<DescriptiveEvaluationInterfaceProps> = ({
  submission,
  questions,
  onEvaluate,
  onClose,
  isEvaluated = false,
  examMaxMarks = 100
}) => {
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState({
    marks: submission.evaluation?.overallScore || 0,
    feedback: submission.evaluation?.feedback || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarksChange = (value: number) => {
    setEvaluation(prev => ({
      ...prev,
      marks: value
    }));
  };



  const handleSubmitEvaluation = async () => {
    if (evaluation.marks === 0) {
      toast({
        title: "Marks Required",
        description: "Please enter marks before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const evaluationData = {
        overallScore: evaluation.marks,
        feedback: evaluation.feedback
      };

      await onEvaluate(evaluationData);
      
      toast({
        title: "Marks Submitted",
        description: "The marks have been successfully submitted.",
      });
      
      // Close the modal after successful submission
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit marks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };



  return (
    <div className="space-y-6">
      {/* Submission Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{submission.exam.title}</CardTitle>
              <CardDescription>
                Descriptive Exam - Milestone {submission.exam.milestone}
              </CardDescription>
            </div>
            <Badge 
              variant={submission.status === 'evaluated' ? 'default' : 'secondary'}
              className="px-4 py-2"
            >
              {submission.status === 'evaluated' ? '✅ Evaluated' : '⏳ Pending'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{submission.student.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Submitted: {formatDate(submission.submittedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{submission.descriptiveAnswers.filter(answer => answer.textAnswer || answer.pdfUrl).length} answers</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Type: Descriptive</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Submissions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Question Submissions</h3>
        {questions.map((question, index) => {
          const answer = submission.descriptiveAnswers.find(a => a.questionIndex === index);
          
          return (
            <Card key={index} className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Question {index + 1}</Badge>
                    <Badge variant="outline">{question.maxPoints} points max</Badge>
                    {question.wordLimit && (
                      <Badge variant="outline">{question.wordLimit} words limit</Badge>
                    )}
                  </div>
                  {answer && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{question.question}</h4>
                  {question.instructions && (
                    <p className="text-sm text-gray-600 mb-3">{question.instructions}</p>
                  )}
                </div>

                {answer ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    {/* Text Answer */}
                    {answer.textAnswer && (
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        <h5 className="font-medium text-gray-700 mb-2">Text Answer:</h5>
                        <p className="text-gray-800">{answer.textAnswer}</p>
                      </div>
                    )}
                    
                    {/* PDF Answer */}
                    {answer.pdfUrl && answer.fileName && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{answer.fileName}</p>
                            <p className="text-sm text-gray-600">
                              {answer.fileSize ? formatFileSize(answer.fileSize) : 'Unknown size'} • 
                              Submitted: {formatDate(answer.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`http://localhost:5000${answer.pdfUrl}`, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `http://localhost:5000${answer.pdfUrl}`;
                              link.download = answer.fileName;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800">No submission for this question</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Simple Marks Entry Form */}
      {!isEvaluated && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl text-blue-900">📝 Enter Marks</CardTitle>
            <CardDescription>
              Enter marks for the student's descriptive exam submission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Marks Entry */}
            <div className="space-y-4">
              <div>
                                 <Label htmlFor="marks" className="text-lg font-semibold">
                   Marks (0-{examMaxMarks})
                 </Label>
                 <Input
                   id="marks"
                   type="number"
                   min="0"
                   max={examMaxMarks}
                   placeholder={`Enter marks (0-${examMaxMarks})`}
                   value={evaluation.marks}
                   onChange={(e) => handleMarksChange(parseInt(e.target.value) || 0)}
                   className="mt-2 text-lg font-medium"
                 />
                 <p className="text-sm text-gray-600 mt-1">
                   Enter the total marks out of {examMaxMarks} for this submission
                 </p>
              </div>
            </div>

            {/* Optional Feedback */}
            <div className="space-y-3">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Provide optional feedback for the student..."
                value={evaluation.feedback}
                onChange={(e) => setEvaluation(prev => ({ ...prev, feedback: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting || evaluation.marks === 0}
                className="px-8 py-3"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Marks'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marks Results (if already evaluated) */}
      {isEvaluated && submission.evaluation && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-xl text-green-900">✅ Marks Awarded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="text-center">
               <div className="text-4xl font-bold text-green-600 mb-2">
                 {submission.evaluation.overallScore}/{examMaxMarks}
               </div>
               <div className="text-lg text-gray-600">Total Marks</div>
             </div>

            {submission.evaluation.feedback && (
              <div>
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-gray-700">{submission.evaluation.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DescriptiveEvaluationInterface;



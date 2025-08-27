import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';

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
    pdfUrl: string;
    fileName: string;
    fileSize: number;
    submittedAt: Date;
  }>;
  status: 'pending' | 'evaluated' | 'approved' | 'rejected';
  submittedAt: Date;
  evaluation?: {
    evaluatedBy: string | { _id: string; name: string };
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

interface DescriptiveResultsViewProps {
  submission: DescriptiveSubmission;
  questions: DescriptiveQuestion[];
  onClose: () => void;
  examMaxMarks?: number;
}

const DescriptiveResultsView: React.FC<DescriptiveResultsViewProps> = ({
  submission,
  questions,
  onClose,
  examMaxMarks = 100
}) => {
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

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending Evaluation
        </Badge>;
      case 'evaluated':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Evaluated
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{submission.exam.title}</h1>
          <p className="text-muted-foreground">Descriptive Exam Results</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button variant="outline" onClick={onClose}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Submission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Submitted:</span>
              <span>{formatDate(submission.submittedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Student:</span>
              <span>{submission.student.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Files Uploaded:</span>
              <span>{submission.descriptiveAnswers.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Milestone:</span>
              <span>{submission.exam.milestone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Results (if evaluated) */}
      {submission.evaluation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Marks Awarded
            </CardTitle>
            <CardDescription>
              Evaluated by {typeof submission.evaluation.evaluatedBy === 'string' 
                ? submission.evaluation.evaluatedBy 
                : submission.evaluation.evaluatedBy.name} on {formatDate(submission.evaluation.evaluatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Marks */}
                         <div className="text-center p-6 bg-green-50 rounded-lg">
               <div className="text-4xl font-bold text-green-600 mb-2">{submission.evaluation.overallScore}/{examMaxMarks}</div>
               <div className="text-lg text-green-700">Total Marks</div>
             </div>

            {/* Feedback */}
            {submission.evaluation.feedback && (
              <div>
                <h4 className="font-medium mb-2">Feedback:</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{submission.evaluation.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submitted Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Submitted Files
          </CardTitle>
          <CardDescription>
            {submission.descriptiveAnswers.length} PDF file(s) uploaded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submission.descriptiveAnswers.map((answer, index) => {
            const question = questions[answer.questionIndex];
            return (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">
                      Question {answer.questionIndex + 1}: {question?.question}
                    </h4>
                    {question?.instructions && (
                      <p className="text-sm text-muted-foreground mb-3">{question.instructions}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>File: {answer.fileName}</span>
                      <span>Size: {formatFileSize(answer.fileSize)}</span>
                      <span>Uploaded: {formatDate(answer.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://service-3-backend-production.up.railway.app${answer.pdfUrl}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `https://service-3-backend-production.up.railway.app${answer.pdfUrl}`;
                        link.download = answer.fileName;
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Status Message */}
      {submission.status === 'pending' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Evaluation Pending</h4>
                <p className="text-sm text-blue-700">
                  Your submission is currently being reviewed by an evaluator. You will receive your results once the evaluation is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DescriptiveResultsView;

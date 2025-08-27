import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Default Telugu letters for puzzle grid (moved outside component to avoid re-renders)
const defaultTeluguLetters = [
  "అ", "ఆ", "ఇ", "ఈ", "ఉ", "ఊ", "ఋ", "ౠ", "ఎ", "ఏ",
  "ఐ", "ఒ", "ఓ", "ఔ", "అం", "అః", "క", "ఖ", "గ", "ఘ",
  "ఙ", "చ", "ఛ", "జ", "ఝ", "ఞ", "ట", "ఠ", "డ", "ఢ",
  "ణ", "త", "థ", "ద", "ధ", "న", "ప", "ఫ", "బ", "భ",
  "మ", "య", "ర", "ల", "వ", "శ", "ష", "స", "హ", "ళ",
  "క్ష", "ఱ", "కా", "కి", "కీ", "కు", "కూ", "కృ", "కే", "కై",
  "కొ", "కో", "కౌ", "కం", "కః", "గా", "గి", "గీ", "గు", "గూ",
  "గృ", "గే", "గై", "గొ", "గో", "గౌ", "గం", "గః", "చా", "చి",
  "చీ", "చు", "చూ", "చృ", "చే", "చై", "చొ", "చో", "చౌ", "చం",
  "చః", "తా", "తి", "తీ", "తు", "తూ", "తృ", "తే", "తై", "తొ"
];

interface GreenBox {
  id: string;
  row: number;
  col: number;
  explanation: string; // What shows when revealed as correct
}

interface PuzzleCell {
  letter: string;
  isGreenBox: boolean; // Set by trainer as correct answer
  explanation: string; // Explanation for this green box
}

interface WordPuzzleConfig {
  id: string;
  milestone: number;
  title: string;
  grid: PuzzleCell[][];
  greenBoxes: GreenBox[]; // All correct answers set by trainer
  updatedAt: Date;
}

interface WordPuzzleProps {
  milestone: number;
  title: string;
  teluguTitle: string;
  description: string;
}

const WordPuzzle = ({ milestone, title, teluguTitle, description }: WordPuzzleProps) => {
  const [puzzleConfig, setPuzzleConfig] = useState<WordPuzzleConfig | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()); // Student's selections
  const [isSubmitted, setIsSubmitted] = useState(false); // Whether exam is submitted
  const [examResults, setExamResults] = useState<{
    correct: string[];
    incorrect: string[];
    missed: string[];
    score: number;
    passed: boolean;
  } | null>(null);
  
  const { toast } = useToast();

  // 6x6 grid
  const gridSize = 6;

  // Load puzzle configuration
  useEffect(() => {
    // Validate milestone prop
    if (!milestone || milestone < 9 || milestone > 19) {
      console.error('Invalid milestone for WordPuzzle:', milestone);
      return;
    }

    try {
      // Try to load trainer configuration from localStorage
      const savedPuzzle = localStorage.getItem(`puzzle-${milestone}`);
      if (savedPuzzle) {
        try {
          const parsedPuzzle: WordPuzzleConfig = JSON.parse(savedPuzzle);
          if (parsedPuzzle && parsedPuzzle.grid && parsedPuzzle.greenBoxes) {
            setPuzzleConfig(parsedPuzzle);
            return;
          }
        } catch (error) {
          console.error('Error parsing saved puzzle:', error);
          // Clear invalid data
          localStorage.removeItem(`puzzle-${milestone}`);
        }
      }

      // Create default puzzle with green boxes
      const defaultConfig: WordPuzzleConfig = {
        id: `puzzle-${milestone}`,
        milestone,
        title: `Milestone ${milestone}`,
        grid: [],
        greenBoxes: [
          {
            id: "green-1",
            row: 1,
            col: 2,
            explanation: "అ - First vowel in Telugu alphabet"
          },
          {
            id: "green-2",
            row: 2,
            col: 4,
            explanation: "క - First consonant in Telugu alphabet"
          },
          {
            id: "green-3",
            row: 3,
            col: 1,
            explanation: "మ - Important consonant sound"
          },
          {
            id: "green-4",
            row: 4,
            col: 3,
            explanation: "ర - Rolling R sound"
          }
        ],
        updatedAt: new Date()
      };

      // Initialize grid with Telugu letters
      const grid: PuzzleCell[][] = [];
      let letterIndex = 0;
      
      for (let row = 0; row < 6; row++) {
        grid[row] = [];
        for (let col = 0; col < 6; col++) {
          const isGreenBox = defaultConfig.greenBoxes.some(gb => gb.row === row && gb.col === col);
          const greenBox = defaultConfig.greenBoxes.find(gb => gb.row === row && gb.col === col);
          
          grid[row][col] = {
            letter: defaultTeluguLetters[letterIndex % defaultTeluguLetters.length],
            isGreenBox: isGreenBox,
            explanation: greenBox ? greenBox.explanation : ""
          };
          letterIndex++;
        }
      }

      defaultConfig.grid = grid;
      setPuzzleConfig(defaultConfig);
    } catch (error) {
      console.error('Error in WordPuzzle useEffect:', error);
      // Fallback to a minimal configuration
      const fallbackConfig: WordPuzzleConfig = {
        id: `puzzle-${milestone}`,
        milestone,
        title: `Milestone ${milestone}`,
        grid: [],
        greenBoxes: [],
        updatedAt: new Date()
      };
      
      // Create minimal grid
      const grid: PuzzleCell[][] = [];
      for (let row = 0; row < 6; row++) {
        grid[row] = [];
        for (let col = 0; col < 6; col++) {
          grid[row][col] = {
            letter: defaultTeluguLetters[(row * 6 + col) % defaultTeluguLetters.length],
            isGreenBox: false,
            explanation: ""
          };
        }
      }
      fallbackConfig.grid = grid;
      setPuzzleConfig(fallbackConfig);
    }
  }, [milestone]);

  // Handle student clicking on cells (before submit)
  const handleCellClick = (row: number, col: number) => {
    if (!puzzleConfig || isSubmitted) return;

    const cellKey = `${row}-${col}`;
    
    // Toggle selection
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
        toast({
          title: "Cell Deselected",
          description: `Removed selection at (${row},${col})`,
          duration: 1500
        });
      } else {
        newSet.add(cellKey);
        toast({
          title: "Cell Selected",
          description: `Selected cell at (${row},${col})`,
          duration: 1500
        });
      }
      return newSet;
    });
  };

  // Handle exam submission
  const handleSubmitExam = async () => {
    if (!puzzleConfig) return;

    const correctCells = new Set(
      puzzleConfig.greenBoxes.map(gb => `${gb.row}-${gb.col}`)
    );
    
    const studentSelections = Array.from(selectedCells);
    const correct: string[] = [];
    const incorrect: string[] = [];
    const missed: string[] = [];

    // Check student selections
    studentSelections.forEach(cellKey => {
      if (correctCells.has(cellKey)) {
        correct.push(cellKey);
      } else {
        incorrect.push(cellKey);
      }
    });

    // Find missed correct answers
    correctCells.forEach(cellKey => {
      if (!selectedCells.has(cellKey)) {
        missed.push(cellKey);
      }
    });

    const totalCorrect = correctCells.size;
    const score = Math.round((correct.length / totalCorrect) * 100);
    const passed = correct.length === totalCorrect && incorrect.length === 0;

    const results = {
      correct,
      incorrect,
      missed,
      score,
      passed
    };

    setExamResults(results);
    setIsSubmitted(true);

    // Submit to backend
    try {
      const token = localStorage.getItem('telugu-basics-token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const submissionData = {
        milestone: milestone,
        submissionType: 'voice', // Use 'voice' type to appear in voice recordings
        type: 'milestone',
        wordPuzzle: {
          correctSelections: correct,
          incorrectSelections: incorrect,
          missedSelections: missed,
          score: score,
          passed: passed,
          totalGreenBoxes: totalCorrect,
          selectedCount: studentSelections.length,
          submittedAt: new Date()
        },
        stepTitle: `Milestone ${milestone} Word Puzzle`,
        lessonId: `lesson-${milestone}`,
        lessonTitle: title,
        status: passed ? 'evaluated' : 'pending', // Auto-evaluate if passed
        score: passed ? score : undefined,
        submittedAt: new Date()
      };

      console.log('🎯 Submitting word puzzle results:', submissionData);

      const response = await fetch('https://service-3-backend-production.up.railway.app/api/submissions/milestone-voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Word puzzle submission successful:', result);
        
        toast({
          title: passed ? "🎉 Excellent!" : "📝 Exam Submitted",
          description: passed ? "Perfect score! All green boxes found!" : `Score: ${score}% - ${passed ? "Passed" : "Need Improvement"}`,
          duration: 5000
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Word puzzle submission failed:', errorText);
        
        toast({
          title: "Submission Error",
          description: "Failed to submit results. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error submitting word puzzle:', error);
      
      toast({
        title: "Submission Error",
        description: "Failed to submit results. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Reset exam
  const resetExam = () => {
    setSelectedCells(new Set());
    setIsSubmitted(false);
    setExamResults(null);
    toast({
      title: "Exam Reset",
      description: "You can try again now!",
      duration: 2000
    });
  };

  // Get cell styling based on exam state
  const getCellStyle = (row: number, col: number) => {
    if (!puzzleConfig) return {};

    const cell = puzzleConfig.grid[row]?.[col];
    if (!cell) return {};

    const cellKey = `${row}-${col}`;
    const isSelected = selectedCells.has(cellKey);
    const isCorrectAnswer = cell.isGreenBox;

    if (isSubmitted && examResults) {
      // After submission - show results
      if (examResults.correct.includes(cellKey)) {
        // Correct selection
        return {
          backgroundColor: "#dcfce7",
          border: "3px solid #16a34a",
          cursor: "default",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#166534"
        };
      } else if (examResults.incorrect.includes(cellKey)) {
        // Incorrect selection
        return {
          backgroundColor: "#fef2f2",
          border: "3px solid #dc2626",
          cursor: "default",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#dc2626"
        };
      } else if (examResults.missed.includes(cellKey)) {
        // Missed correct answer
        return {
          backgroundColor: "#fefce8",
          border: "3px solid #eab308",
          cursor: "default",
          fontWeight: "bold",
          fontSize: "1.1rem",
          color: "#a16207"
        };
      }
    }

    // Before submission - show only student selections
    if (isSelected) {
      return {
        backgroundColor: "#dbeafe",
        border: "2px solid #2563eb",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "1.1rem",
        color: "#1d4ed8"
      };
    }

    // Default unselected cell
    return {
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      cursor: isSubmitted ? "default" : "pointer",
      fontSize: "1rem",
      color: "#6b7280"
    };
  };

  // Early validation
  if (!milestone || milestone < 9 || milestone > 19) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: WordPuzzle component requires a valid milestone (9-19)</p>
        <p>Received milestone: {milestone}</p>
      </div>
    );
  }

  if (!puzzleConfig) {
    return <div className="text-center py-8">Loading word puzzle...</div>;
  }

  const totalGreenBoxes = puzzleConfig.greenBoxes.length;
  const selectedCount = selectedCells.size;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-lg text-primary font-medium">{teluguTitle}</p>
        <p className="text-muted-foreground">{description}</p>
        <Badge variant="outline">Milestone {milestone}</Badge>
      </div>

      {/* Exam Status */}
      {!isSubmitted ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Telugu Letter Exam</span>
            </div>
            <div className="text-sm text-blue-700">
              Selected: {selectedCount} cells • Target: {totalGreenBoxes} green boxes
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg p-4 border ${examResults?.passed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${examResults?.passed ? 'text-green-600' : 'text-yellow-600'}`} />
              <span className={`font-medium ${examResults?.passed ? 'text-green-900' : 'text-yellow-900'}`}>
                Exam Results: {examResults?.score}%
              </span>
            </div>
            <div className={`text-sm ${examResults?.passed ? 'text-green-700' : 'text-yellow-700'}`}>
              {examResults?.passed ? "Perfect Score! 🎉" : "Need Improvement 📚"}
            </div>
          </div>
        </div>
      )}

      {/* Telugu Letter Exam Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Telugu Letter Exam Grid
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {!isSubmitted 
              ? "Click on cells you think are correct green boxes, then submit your answer"
              : "Results: Green = Correct, Red = Wrong, Yellow = Missed"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="grid grid-cols-10 gap-1 border-2 border-gray-300 p-4 bg-white rounded-lg">
              {puzzleConfig.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const isSelected = selectedCells.has(cellKey);
                  
                  return (
                    <div
                      key={cellKey}
                      className="relative w-12 h-12 flex items-center justify-center border border-gray-200 transition-all duration-200 hover:shadow-md"
                      style={getCellStyle(rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      title={
                        isSubmitted
                          ? `Cell (${rowIndex},${colIndex}): ${cell.letter}`
                          : isSelected 
                            ? `Selected: ${cell.letter} - Click to deselect`
                            : `Click to select: ${cell.letter}`
                      }
                    >
                      {cell.letter}
                      {isSelected && !isSubmitted && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit/Reset Button */}
          <div className="flex justify-center gap-4">
            {!isSubmitted ? (
              <Button 
                onClick={handleSubmitExam}
                disabled={selectedCells.size === 0}
                className="px-8 py-3 text-lg"
              >
                Submit Exam ({selectedCount} selected)
              </Button>
            ) : (
              <Button 
                onClick={resetExam}
                variant="outline"
                className="px-8 py-3 text-lg"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exam Results Details */}
      {isSubmitted && examResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Detailed Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Correct Answers */}
              {examResults.correct.length > 0 && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    ✅ Correct ({examResults.correct.length})
                  </h4>
                  <div className="space-y-2">
                    {examResults.correct.map(cellKey => {
                      const [row, col] = cellKey.split('-').map(Number);
                      const cell = puzzleConfig.grid[row][col];
                      return (
                        <div key={cellKey} className="text-sm">
                          <div className="font-medium">({row},{col}): {cell.letter}</div>
                          <div className="text-green-600">{cell.explanation}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Incorrect Answers */}
              {examResults.incorrect.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                    ❌ Incorrect ({examResults.incorrect.length})
                  </h4>
                  <div className="space-y-2">
                    {examResults.incorrect.map(cellKey => {
                      const [row, col] = cellKey.split('-').map(Number);
                      const cell = puzzleConfig.grid[row][col];
                      return (
                        <div key={cellKey} className="text-sm">
                          <div className="font-medium">({row},{col}): {cell.letter}</div>
                          <div className="text-red-600">This was not a green box</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missed Answers */}
              {examResults.missed.length > 0 && (
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                    ⚠️ Missed ({examResults.missed.length})
                  </h4>
                  <div className="space-y-2">
                    {examResults.missed.map(cellKey => {
                      const [row, col] = cellKey.split('-').map(Number);
                      const cell = puzzleConfig.grid[row][col];
                      return (
                        <div key={cellKey} className="text-sm">
                          <div className="font-medium">({row},{col}): {cell.letter}</div>
                          <div className="text-yellow-600">{cell.explanation}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Overall Assessment */}
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-2">Assessment</h4>
              <div className="text-sm space-y-1">
                <p>Score: {examResults.score}% ({examResults.correct.length}/{totalGreenBoxes} correct)</p>
                <p className={examResults.passed ? "text-green-600" : "text-yellow-600"}>
                  {examResults.passed 
                    ? "🎉 Excellent! You found all the green boxes correctly!" 
                    : "📚 Need Improvement: Study the missed answers and try again."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Take This Telugu Letter Exam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded mt-1 flex-shrink-0"></div>
              <div>
                <strong>Select cells</strong> you think are "green boxes" by clicking on them
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                Selected cells will turn blue - you can click again to deselect
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <div>
                Click "Submit Exam" when you've selected all cells you think are correct
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Grid3X3 className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                After submitting, see results: Green = Correct, Red = Wrong, Yellow = Missed
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-yellow-800">
                <strong>Exam Goal:</strong> Find all {totalGreenBoxes} green boxes correctly!
              </p>
              <p className="text-yellow-700 mt-1">
                <strong>Passing Score:</strong> 100% - You must find ALL green boxes with NO wrong selections.
              </p>
              <p className="text-yellow-700 mt-1">
                <strong>Note:</strong> Your trainer has set specific cells as "green boxes" for milestone {milestone}.
                Study carefully before selecting!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WordPuzzle; 

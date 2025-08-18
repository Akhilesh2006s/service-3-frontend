// Curriculum Management Service
// Based on "Telugu Basha Sangraha" book content

export interface Lesson {
  id: string;
  title: string;
  teluguTitle: string;
  description: string;
  category: LessonCategory;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: number; // in minutes
  videoUrl: string;
  trainerName: string;
  practiceSteps: PracticeStep[];
  testQuestions: TestQuestion[];
  prerequisites: string[]; // lesson IDs
  isUnlocked: boolean;
  progress: number;
  completed: boolean;
  milestone: number; // milestone number (1-19)
}

export interface PracticeStep {
  id: string;
  title: string;
  teluguText: string;
  englishText: string;
  audioUrl?: string;
  type: "pronunciation" | "recognition" | "translation" | "writing";
  instructions: string;
  expectedDuration: number; // in seconds
}

export interface TestQuestion {
  id: string;
  question: string;
  teluguQuestion?: string;
  type: "multiple-choice" | "voice" | "fill-blank" | "matching";
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export type LessonCategory = 
  | "Alphabets" 
  | "Vowels" 
  | "Consonants" 
  | "Guninthalu" 
  | "Special Characters" 
  | "Words" 
  | "Advanced";

class CurriculumService {
  private lessons: Lesson[] = [
    // VOWELS SECTION
    {
      id: "vowels-1",
      title: "Introduction to Telugu Vowels",
      teluguTitle: "అచ్చుల పరిచయం",
      description: "Learn the basic Telugu vowels and their pronunciation",
      category: "Vowels",
      difficulty: "Beginner",
      duration: 15,
      videoUrl: "/videos/vowels-intro.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [
        {
          id: "v1-p1",
          title: "Basic Vowels Forward",
          teluguText: "అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ అం అః",
          englishText: "a ā i ī u ū ṛ ṝ e ē ai o ō au aṁ aḥ",
          type: "pronunciation",
          instructions: "Practice saying each vowel clearly and distinctly",
          expectedDuration: 30
        },
        {
          id: "v1-p2",
          title: "Basic Vowels Backward",
          teluguText: "అః అం ఔ ఓ ఒ ఐ ఏ ఎ ౠ ఋ ఊ ఉ ఈ ఇ ఆ అ",
          englishText: "aḥ aṁ au ō o ai ē e ṝ ṛ ū u ī i ā a",
          type: "pronunciation",
          instructions: "Practice saying vowels in reverse order",
          expectedDuration: 30
        }
      ],
      testQuestions: [
        {
          id: "v1-t1",
          question: "How many basic vowels are there in Telugu?",
          type: "multiple-choice",
          options: ["12", "14", "16", "18"],
          correctAnswer: "16",
          explanation: "Telugu has 16 basic vowels including అ, ఆ, ఇ, ఈ, ఉ, ఊ, ఋ, ౠ, ఎ, ఏ, ఐ, ఒ, ఓ, ఔ, అం, అః",
          points: 10
        }
      ],
      prerequisites: [],
      isUnlocked: true,
      progress: 0,
      completed: false,
      milestone: 1
    },

    // CONSONANTS SECTION
    {
      id: "consonants-1",
      title: "Telugu Consonants - Part 1",
      teluguTitle: "హల్లులు - మొదటి భాగం",
      description: "Learn the first set of Telugu consonants (క to ఞ)",
      category: "Consonants",
      difficulty: "Beginner",
      duration: 20,
      videoUrl: "/videos/consonants-part1.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [
        {
          id: "c1-p1",
          title: "Velar Consonants",
          teluguText: "క ఖ గ ఘ ఙ",
          englishText: "ka kha ga gha ṅa",
          type: "pronunciation",
          instructions: "Practice velar consonants with proper tongue position",
          expectedDuration: 45
        },
        {
          id: "c1-p2",
          title: "Palatal Consonants",
          teluguText: "చ ఛ జ ఝ ఞ",
          englishText: "ca cha ja jha ña",
          type: "pronunciation",
          instructions: "Practice palatal consonants with proper articulation",
          expectedDuration: 45
        }
      ],
      testQuestions: [
        {
          id: "c1-t1",
          question: "Which consonant is pronounced as 'ka'?",
          type: "multiple-choice",
          options: ["ఖ", "క", "గ", "ఘ"],
          correctAnswer: "క",
          explanation: "క is pronounced as 'ka' in Telugu",
          points: 10
        }
      ],
      prerequisites: ["vowels-1"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 2
    },

    {
      id: "consonants-2",
      title: "Telugu Consonants - Part 2",
      teluguTitle: "హల్లులు - రెండవ భాగం",
      description: "Learn the second set of Telugu consonants (ట to న)",
      category: "Consonants",
      difficulty: "Beginner",
      duration: 20,
      videoUrl: "/videos/consonants-part2.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [
        {
          id: "c2-p1",
          title: "Retroflex Consonants",
          teluguText: "ట ఠ డ ఢ ణ",
          englishText: "ṭa ṭha ḍa ḍha ṇa",
          type: "pronunciation",
          instructions: "Practice retroflex consonants by curling tongue back",
          expectedDuration: 45
        },
        {
          id: "c2-p2",
          title: "Dental Consonants",
          teluguText: "త థ ద ధ న",
          englishText: "ta tha da dha na",
          type: "pronunciation",
          instructions: "Practice dental consonants with tongue against teeth",
          expectedDuration: 45
        }
      ],
      testQuestions: [
        {
          id: "c2-t1",
          question: "Which sound is retroflex?",
          type: "multiple-choice",
          options: ["త", "ట", "క", "చ"],
          correctAnswer: "ట",
          explanation: "ట is a retroflex consonant requiring tongue curl",
          points: 10
        }
      ],
      prerequisites: ["consonants-1"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 3
    },

    // GUNINTHALU SECTION
    {
      id: "guninthalu-1",
      title: "Guninthalu Method 1",
      teluguTitle: "గుణింతాలు మొదటి పద్ధతి",
      description: "Learn the first method of combining consonants with vowels",
      category: "Guninthalu",
      difficulty: "Intermediate",
      duration: 25,
      videoUrl: "/videos/guninthalu-method1.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [
        {
          id: "g1-p1",
          title: "Ka Series Guninthalu",
          teluguText: "క కా కి కీ కు కూ కృ కౄ కె కే కై కొ కో కౌ కం కః",
          englishText: "ka kā ki kī ku kū kṛ kṝ ke kē kai ko kō kau kaṁ kaḥ",
          type: "pronunciation",
          instructions: "Practice ka series with all vowel combinations",
          expectedDuration: 60
        },
        {
          id: "g1-p2",
          title: "Ga Series Guninthalu",
          teluguText: "గ గా గి గీ గు గూ గృ గౄ గె గే గై గొ గో గౌ గం గః",
          englishText: "ga gā gi gī gu gū gṛ gṝ ge gē gai go gō gau gaṁ gaḥ",
          type: "pronunciation",
          instructions: "Practice ga series with all vowel combinations",
          expectedDuration: 60
        }
      ],
      testQuestions: [
        {
          id: "g1-t1",
          question: "What is క + ఈ equal to?",
          type: "multiple-choice",
          options: ["కి", "కీ", "కు", "కూ"],
          correctAnswer: "కీ",
          explanation: "క + ఈ = కీ (ka + ī = kī)",
          points: 10
        }
      ],
      prerequisites: ["consonants-1", "consonants-2"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 4
    },

    // SPECIAL CHARACTERS
    {
      id: "special-chars",
      title: "Special Telugu Characters",
      teluguTitle: "విశేష అక్షరాలు",
      description: "Learn special characters like talakattu, visargam, etc.",
      category: "Special Characters",
      difficulty: "Intermediate",
      duration: 20,
      videoUrl: "/videos/special-characters.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [
        {
          id: "sc-p1",
          title: "Talakattu to Visargam",
          teluguText: "తలకట్టు to విసర్గమ్",
          englishText: "From talakattu to visargam",
          type: "pronunciation",
          instructions: "Practice special character combinations",
          expectedDuration: 45
        }
      ],
      testQuestions: [
        {
          id: "sc-t1",
          question: "What is the special character for 'am' sound?",
          type: "multiple-choice",
          options: ["అం", "అః", "అ౦", "అ౧"],
          correctAnswer: "అం",
          explanation: "అం represents the 'am' sound in Telugu",
          points: 10
        }
      ],
      prerequisites: ["guninthalu-1"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 5
    },

    // ADVANCED SECTIONS
    {
      id: "advanced-1",
      title: "Complex Consonant Combinations",
      teluguTitle: "సంక్లిష్ట హల్లుల మిళితములు",
      description: "Learn complex consonant combinations and their rules",
      category: "Advanced",
      difficulty: "Advanced",
      duration: 30,
      videoUrl: "/videos/advanced-combinations.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [
        {
          id: "adv1-p1",
          title: "Three Consonant Combinations",
          teluguText: "క్త, క్ష, క్ష్మ",
          englishText: "kta, kṣa, kṣma",
          type: "pronunciation",
          instructions: "Practice complex three-consonant combinations",
          expectedDuration: 90
        }
      ],
      testQuestions: [
        {
          id: "adv1-t1",
          question: "Which combination represents 'kta'?",
          type: "multiple-choice",
          options: ["క్త", "క్ష", "క్ష్మ", "క్ట"],
          correctAnswer: "క్త",
          explanation: "క్త represents the combination of ka + ta",
          points: 15
        }
      ],
      prerequisites: ["special-chars"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 6
    },

    // Additional lessons for milestones 7-19
    {
      id: "guninthalu-2",
      title: "Guninthalu Method 2",
      teluguTitle: "గుణింతాలు రెండవ పద్ధతి",
      description: "Learn the second method of combining consonants with vowels",
      category: "Guninthalu",
      difficulty: "Intermediate",
      duration: 25,
      videoUrl: "/videos/guninthalu-method2.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["guninthalu-1"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 7
    },

    {
      id: "guninthalu-3",
      title: "Guninthalu Method 3",
      teluguTitle: "గుణింతాలు మూడవ పద్ధతి",
      description: "Learn the third method of combining consonants with vowels",
      category: "Guninthalu",
      difficulty: "Intermediate",
      duration: 25,
      videoUrl: "/videos/guninthalu-method3.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["guninthalu-2"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 8
    },

    {
      id: "words-1",
      title: "Simple Words (50 Words)",
      teluguTitle: "50 సరళ పదాలు",
      description: "Practice basic Telugu vocabulary with simple words",
      category: "Words",
      difficulty: "Intermediate",
      duration: 30,
      videoUrl: "/videos/simple-words.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["guninthalu-3"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 9
    },

    {
      id: "words-2",
      title: "Four-Step Method - Stage One",
      teluguTitle: "four step method stage one",
      description: "Learn the foundational four-step approach to word formation",
      category: "Words",
      difficulty: "Advanced",
      duration: 35,
      videoUrl: "/videos/four-step-stage1.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-1"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 10
    },

    {
      id: "words-3",
      title: "Four-Step Method - Stage Two",
      teluguTitle: "four step method stage two",
      description: "Advanced four-step method for complex word formation",
      category: "Words",
      difficulty: "Advanced",
      duration: 35,
      videoUrl: "/videos/four-step-stage2.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-2"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 11
    },

    {
      id: "words-4",
      title: "Double Letter Words",
      teluguTitle: "10 ద్విత్వాక్షర పదాలు",
      description: "Practice double consonant words with four-step method",
      category: "Words",
      difficulty: "Advanced",
      duration: 40,
      videoUrl: "/videos/double-letter-words.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-3"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 12
    },

    {
      id: "words-5",
      title: "Compound Letter Words",
      teluguTitle: "10 సంయుక్తాక్షర పదాలు",
      description: "Practice compound consonant words with four-step method",
      category: "Words",
      difficulty: "Advanced",
      duration: 40,
      videoUrl: "/videos/compound-letter-words.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-4"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 13
    },

    {
      id: "words-6",
      title: "Two Double Letter Words",
      teluguTitle: "10 రెండు ద్విత్వాక్షార పదాలు",
      description: "Practice complex double consonant combinations",
      category: "Words",
      difficulty: "Advanced",
      duration: 45,
      videoUrl: "/videos/two-double-letter-words.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-5"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 14
    },

    {
      id: "words-7",
      title: "Two Compound Letter Words",
      teluguTitle: "10 రెండు సంయుక్తాక్షార పదాలు",
      description: "Practice advanced compound consonant words",
      category: "Words",
      difficulty: "Advanced",
      duration: 45,
      videoUrl: "/videos/two-compound-letter-words.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-6"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 15
    },

    {
      id: "words-8",
      title: "Complex Combination Words",
      teluguTitle: "10 సంశ్లేష అక్షరపదాలు",
      description: "Practice complex compound letter words",
      category: "Words",
      difficulty: "Advanced",
      duration: 50,
      videoUrl: "/videos/complex-combination-words.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-7"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 16
    },

    {
      id: "advanced-2",
      title: "Complete Letter Modification",
      teluguTitle: "హాల్లు ను పూర్తిగా మార్చడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      description: "Learn stress patterns through complete consonant changes",
      category: "Advanced",
      difficulty: "Advanced",
      duration: 55,
      videoUrl: "/videos/complete-letter-modification.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["words-8"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 17
    },

    {
      id: "advanced-3",
      title: "Removing Headmarks",
      teluguTitle: "హాల్లు కు వున్న తలకట్టు తీసివేయడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      description: "Learn stress patterns by removing talakattu from consonants",
      category: "Advanced",
      difficulty: "Advanced",
      duration: 55,
      videoUrl: "/videos/removing-headmarks.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["advanced-2"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 18
    },

    {
      id: "advanced-4",
      title: "Natural Emphasis",
      teluguTitle: "హల్లులో ఎలాంటి మార్పు అవసరంలేకుండా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      description: "Learn natural stress patterns without consonant changes",
      category: "Advanced",
      difficulty: "Advanced",
      duration: 55,
      videoUrl: "/videos/natural-emphasis.mp4",
      trainerName: "Mr. Bhaskar Raja",
      practiceSteps: [],
      testQuestions: [],
      prerequisites: ["advanced-3"],
      isUnlocked: false,
      progress: 0,
      completed: false,
      milestone: 19
    }
  ];

  // Get all lessons
  getAllLessons(): Lesson[] {
    return this.lessons;
  }

  // Get lesson by ID
  getLessonById(id: string): Lesson | undefined {
    return this.lessons.find(lesson => lesson.id === id);
  }

  // Get lessons by category
  getLessonsByCategory(category: LessonCategory): Lesson[] {
    return this.lessons.filter(lesson => lesson.category === category);
  }

  // Get lessons by difficulty
  getLessonsByDifficulty(difficulty: "Beginner" | "Intermediate" | "Advanced"): Lesson[] {
    return this.lessons.filter(lesson => lesson.difficulty === difficulty);
  }

  // Get unlocked lessons
  getUnlockedLessons(): Lesson[] {
    return this.lessons.filter(lesson => lesson.isUnlocked);
  }

  // Check if lesson can be unlocked
  canUnlockLesson(lessonId: string, completedLessons: string[]): boolean {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return false;

    return lesson.prerequisites.every(prereq => completedLessons.includes(prereq));
  }

  // Unlock lesson based on completed prerequisites
  unlockLesson(lessonId: string, completedLessons: string[]): boolean {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return false;

    if (this.canUnlockLesson(lessonId, completedLessons)) {
      lesson.isUnlocked = true;
      return true;
    }
    return false;
  }

  // Update lesson progress
  updateLessonProgress(lessonId: string, progress: number): void {
    const lesson = this.getLessonById(lessonId);
    if (lesson) {
      lesson.progress = Math.min(100, Math.max(0, progress));
      if (lesson.progress >= 100) {
        lesson.completed = true;
      }
    }
  }

  // Get curriculum statistics
  getCurriculumStats(): {
    totalLessons: number;
    completedLessons: number;
    unlockedLessons: number;
    overallProgress: number;
    categoryProgress: Record<LessonCategory, number>;
  } {
    const totalLessons = this.lessons.length;
    const completedLessons = this.lessons.filter(l => l.completed).length;
    const unlockedLessons = this.lessons.filter(l => l.isUnlocked).length;
    const overallProgress = this.lessons.reduce((sum, lesson) => sum + lesson.progress, 0) / totalLessons;

    const categoryProgress: Record<LessonCategory, number> = {
      "Alphabets": 0,
      "Vowels": 0,
      "Consonants": 0,
      "Guninthalu": 0,
      "Special Characters": 0,
      "Words": 0,
      "Advanced": 0
    };

    // Calculate progress for each category
    Object.keys(categoryProgress).forEach(category => {
      const categoryLessons = this.getLessonsByCategory(category as LessonCategory);
      if (categoryLessons.length > 0) {
        categoryProgress[category as LessonCategory] = 
          categoryLessons.reduce((sum, lesson) => sum + lesson.progress, 0) / categoryLessons.length;
      }
    });

    return {
      totalLessons,
      completedLessons,
      unlockedLessons,
      overallProgress,
      categoryProgress
    };
  }

  // Get next recommended lesson
  getNextRecommendedLesson(completedLessons: string[]): Lesson | null {
    const unlockedLessons = this.lessons.filter(lesson => 
      lesson.isUnlocked && !lesson.completed && 
      lesson.prerequisites.every(prereq => completedLessons.includes(prereq))
    );

    if (unlockedLessons.length === 0) return null;

    // Return the first unlocked lesson (could be enhanced with more sophisticated logic)
    return unlockedLessons[0];
  }

  // Get practice steps for a lesson
  getPracticeSteps(lessonId: string): PracticeStep[] {
    const lesson = this.getLessonById(lessonId);
    return lesson?.practiceSteps || [];
  }

  // Get test questions for a lesson
  getTestQuestions(lessonId: string): TestQuestion[] {
    const lesson = this.getLessonById(lessonId);
    return lesson?.testQuestions || [];
  }

  // Search lessons by title or content
  searchLessons(query: string): Lesson[] {
    const lowercaseQuery = query.toLowerCase();
    return this.lessons.filter(lesson => 
      lesson.title.toLowerCase().includes(lowercaseQuery) ||
      lesson.teluguTitle.toLowerCase().includes(lowercaseQuery) ||
      lesson.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get lesson path (prerequisites chain)
  getLessonPath(lessonId: string): Lesson[] {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return [];

    const path: Lesson[] = [];
    const visited = new Set<string>();

    const addPrerequisites = (currentLesson: Lesson) => {
      for (const prereqId of currentLesson.prerequisites) {
        if (!visited.has(prereqId)) {
          visited.add(prereqId);
          const prereqLesson = this.getLessonById(prereqId);
          if (prereqLesson) {
            addPrerequisites(prereqLesson);
            path.push(prereqLesson);
          }
        }
      }
    };

    addPrerequisites(lesson);
    path.push(lesson);

    return path;
  }
}

// Export singleton instance
export const curriculumService = new CurriculumService();

// Export for testing
export { CurriculumService }; 
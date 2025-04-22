import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart2, 
  BookOpen, 
  Edit, 
  Eye, 
  Plus, 
  Search, 
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Mock exam data
const mockExams = [
  { 
    id: "1", 
    name: "Math Midterm", 
    subject: "Mathematics", 
    term: "Term 1", 
    academicYear: "2023-2024", 
    maxScore: 100,
    examDate: "2023-10-15",
    studentsTaken: 42,
    averageScore: 76.5
  },
  { 
    id: "2", 
    name: "English Composition", 
    subject: "English", 
    term: "Term 1", 
    academicYear: "2023-2024", 
    maxScore: 50,
    examDate: "2023-10-22",
    studentsTaken: 45,
    averageScore: 82.3
  },
  { 
    id: "3", 
    name: "Science Final", 
    subject: "Science", 
    term: "Term 1", 
    academicYear: "2023-2024", 
    maxScore: 100,
    examDate: "2023-12-05",
    studentsTaken: 40,
    averageScore: 68.2
  },
  { 
    id: "4", 
    name: "History Quiz", 
    subject: "History", 
    term: "Term 1", 
    academicYear: "2023-2024", 
    maxScore: 30,
    examDate: "2023-11-10",
    studentsTaken: 38,
    averageScore: 74.1
  },
  { 
    id: "5", 
    name: "Geography Project", 
    subject: "Geography", 
    term: "Term 1", 
    academicYear: "2023-2024", 
    maxScore: 50,
    examDate: "2023-11-20",
    studentsTaken: 41,
    averageScore: 79.8
  },
];

// Academic years and terms data
const academicYears = ["2023-2024", "2022-2023", "2021-2022"];
const terms = ["Term 1", "Term 2", "Term 3"];

interface ExamFormData {
  name: string;
  subject: string;
  academicYear: string;
  term: string;
  examDate: string;
  maxScore: string;
  passingScore: string;
}

export default function Exams() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);

  const [formData, setFormData] = useState<ExamFormData>({
    name: "",
    subject: "",
    academicYear: "2023-2024",
    term: "Term 1",
    examDate: "",
    maxScore: "100",
    passingScore: "40",
  });

  // Filter exams based on search term
  const filteredExams = mockExams.filter(
    (exam) =>
      (selectedYear ? exam.academicYear === selectedYear : true) &&
      (selectedTerm ? exam.term === selectedTerm : true) &&
      (searchTerm ? 
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) : true)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding new exam:", formData);
    toast({
      title: "Exam Added",
      description: `${formData.name} has been added successfully.`,
    });
    setIsAddExamOpen(false);
    setFormData({
      name: "",
      subject: "",
      academicYear: "2023-2024",
      term: "Term 1",
      examDate: "",
      maxScore: "100",
      passingScore: "40",
    });
  };

  const handleDelete = (id: string) => {
    console.log("Deleting exam with ID:", id);
    toast({
      title: "Exam Deleted",
      description: "The exam has been deleted successfully.",
    });
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground">Manage and track student examinations</p>
        </div>
        <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
              <DialogDescription>
                Enter the details for the new exam. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Exam Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Math Midterm Exam"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <select
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="2023-2024">2023-2024</option>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2021-2022">2021-2022</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="term">Term</Label>
                  <select
                    id="term"
                    name="term"
                    value={formData.term}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="examDate">Exam Date</Label>
                  <Input
                    id="examDate"
                    name="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="maxScore">Maximum Score</Label>
                  <Input
                    id="maxScore"
                    name="maxScore"
                    type="number"
                    value={formData.maxScore}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="passingScore">Passing Score</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    value={formData.passingScore}
                    onChange={handleInputChange}
                    min="1"
                    max={formData.maxScore}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddExamOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Exam</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-4 mb-4">
        <Select 
          value={selectedYear} 
          onValueChange={setSelectedYear}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedTerm} 
          onValueChange={setSelectedTerm}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map(term => (
              <SelectItem key={term} value={term}>{term}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockExams.length}</div>
            <p className="text-xs text-muted-foreground">
              For current academic year
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(mockExams.reduce((acc, exam) => acc + exam.averageScore, 0) / mockExams.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all exams this term
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Students Taking Exams</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              Out of 45 enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            Manage all exams in the system. Click on an exam to see details and student scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search exams..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Students Taken</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No exams found. Try a different search or add a new exam.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExams.map((exam) => (
                    <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/exams/${exam.id}`)}>
                      <TableCell>{exam.name}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.term}</TableCell>
                      <TableCell>{exam.academicYear}</TableCell>
                      <TableCell>{exam.examDate}</TableCell>
                      <TableCell>{exam.studentsTaken}</TableCell>
                      <TableCell>{exam.averageScore}%</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/exams/${exam.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/exams/${exam.id}`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(exam.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

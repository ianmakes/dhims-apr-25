
import { BarChart2, BookOpen, Users, UserCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data for charts
const studentsByGrade = [
  { name: "Grade 1", students: 24 },
  { name: "Grade 2", students: 36 },
  { name: "Grade 3", students: 42 },
  { name: "Grade 4", students: 48 },
  { name: "Grade 5", students: 54 },
  { name: "Grade 6", students: 60 },
  { name: "Grade 7", students: 66 },
  { name: "Grade 8", students: 72 },
];

const examScoresBySubject = [
  { subject: "Math", averageScore: 78 },
  { subject: "Science", averageScore: 82 },
  { subject: "English", averageScore: 88 },
  { subject: "History", averageScore: 72 },
  { subject: "Geography", averageScore: 76 },
  { subject: "Art", averageScore: 90 },
];

const sponsorDistribution = [
  { name: "Active", value: 80 },
  { name: "Inactive", value: 15 },
  { name: "Pending", value: 5 },
];

const COLORS = ["#4361ee", "#4895ef", "#4cc9f0", "#f72585"];

const monthlyEnrollment = [
  { name: "Jan", count: 12 },
  { name: "Feb", count: 8 },
  { name: "Mar", count: 15 },
  { name: "Apr", count: 10 },
  { name: "May", count: 6 },
  { name: "Jun", count: 14 },
  { name: "Jul", count: 7 },
  { name: "Aug", count: 18 },
  { name: "Sep", count: 22 },
  { name: "Oct", count: 16 },
  { name: "Nov", count: 11 },
  { name: "Dec", count: 9 },
];

// Sample data for recent activities
const recentActivities = [
  {
    id: "1",
    type: "student" as const,
    title: "New Student Enrolled",
    description: "Jane Doe has been registered as a new student in Grade 5",
    timestamp: new Date(2023, 9, 15, 14, 30),
    user: {
      name: "Admin User",
    },
  },
  {
    id: "2",
    type: "sponsor" as const,
    title: "Sponsor Added",
    description: "John Smith has been registered as a new sponsor",
    timestamp: new Date(2023, 9, 14, 11, 45),
    user: {
      name: "Admin User",
    },
  },
  {
    id: "3",
    type: "exam" as const,
    title: "Exam Results Updated",
    description: "Term 2 exam results have been uploaded for Grade 3",
    timestamp: new Date(2023, 9, 13, 9, 15),
    user: {
      name: "Teacher User",
    },
  },
  {
    id: "4",
    type: "system" as const,
    title: "Academic Year Changed",
    description: "Current academic year set to 2023-2024",
    timestamp: new Date(2023, 9, 12, 16, 0),
    user: {
      name: "Admin User",
    },
  },
  {
    id: "5",
    type: "student" as const,
    title: "Student Grade Updated",
    description: "Mike Williams has been promoted to Grade 6",
    timestamp: new Date(2023, 9, 11, 13, 20),
    user: {
      name: "Manager User",
    },
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of David's Hope International Management System
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={452}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          description="Active students in the current academic year"
        />
        <StatsCard
          title="Total Sponsors"
          value={324}
          icon={<UserCircle className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true }}
          description="Active sponsors supporting students"
        />
        <StatsCard
          title="Exams Recorded"
          value={56}
          icon={<BookOpen className="h-5 w-5" />}
          trend={{ value: 5, isPositive: true }}
          description="Total exams recorded in the system"
        />
        <StatsCard
          title="Sponsorship Rate"
          value="86%"
          icon={<BarChart2 className="h-5 w-5" />}
          trend={{ value: 3, isPositive: true }}
          description="Students with active sponsors"
        />
      </div>

      <Tabs defaultValue="enrollment" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="sponsorship">Sponsorship</TabsTrigger>
        </TabsList>
        <TabsContent value="enrollment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="transition-all-medium card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  Students by Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentsByGrade}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="students"
                        name="Students"
                        fill="#4361ee"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all-medium card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  Monthly Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyEnrollment}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="New Students"
                        stroke="#4895ef"
                        fill="#4895ef"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <Card className="transition-all-medium card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Average Exam Scores by Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={examScoresBySubject}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 50,
                      bottom: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="averageScore"
                      name="Average Score"
                      fill="#4cc9f0"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsorship" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="transition-all-medium card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">
                  Sponsor Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-80 w-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sponsorDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {sponsorDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <RecentActivityCard activities={recentActivities} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Card } from "@/components/ui/card";

interface ChartDataPoint {
  name: string;
  percentage: number;
  term?: string;
}

interface TermDataPoint {
  term: string;
  average: number;
}

interface ExamChartsProps {
  trendData: ChartDataPoint[];
  termData: TermDataPoint[];
}

export function ExamCharts({ trendData, termData }: ExamChartsProps) {
  if (trendData.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* Trend Chart */}
      <Card className="p-4">
        <h3 className="font-medium mb-2">Performance Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={trendData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                name="Score %" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Term Average Chart */}
      <Card className="p-4">
        <h3 className="font-medium mb-2">Term Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={termData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="average" 
                name="Term Average %" 
                fill="#8884d8" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

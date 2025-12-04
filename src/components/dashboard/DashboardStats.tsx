import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Heart, Car, Award } from "lucide-react";

export interface DashboardStatsProps {
  stats: {
    upcomingBookings: number;
    favoriteCarwashes: number;
    totalVisits: number;
    rewardsPoints: number;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const statItems = [
    {
      title: "Upcoming Bookings",
      value: stats.upcomingBookings.toString(),
      icon: Calendar,
    },
    {
      title: "Favorite Carwashes",
      value: stats.favoriteCarwashes.toString(),
      icon: Heart,
    },
    {
      title: "Total Visits",
      value: stats.totalVisits.toString(),
      icon: Car,
    },
    {
      title: "Rewards Points",
      value: `${stats.rewardsPoints} pts`,
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import { CircleOff, CheckCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Skeleton } from '../common/skeleton';

interface StatsProps {
  total: number;
  posted: number;
  unposted: number;
  loading?: boolean;
}

export function Stats({ total, posted, unposted, loading = false }: StatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Repositories Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Database className="h-8 w-8 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{total}</div>
          {/* <p className="text-xs text-muted-foreground">
            Total repositories
          </p> */}
        </CardContent>
      </Card>

      {/* Posted Repositories Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Posted</CardTitle>
          <CheckCircle className="h-8 w-8 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{posted}</div>
          {/* <p className="text-xs text-muted-foreground">
            Posted content
          </p> */}
        </CardContent>
      </Card>

      {/* Unposted Repositories Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Unposted</CardTitle>
          <CircleOff className="h-8 w-8 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{unposted}</div>
          {/* <p className="text-xs text-muted-foreground">
            Awaiting posting
          </p> */}
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { useStudyContext } from "@/context/StudyContext";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function StudyStats() {
  const { userStats, sessions } = useStudyContext();
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="shadow-md border border-gray-100">
      <CardContent className="p-6">
        <h2 className="font-heading font-bold text-xl mb-4">Study Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm">Today's Study Time</div>
            <div className="font-bold text-2xl">
              {formatDuration(userStats?.todayStudyTime || 0)}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm">Total Sessions</div>
            <div className="font-bold text-2xl">
              {userStats?.totalSessions || 0}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm">Coins Earned</div>
            <div className="font-bold text-2xl">
              {userStats?.currency || 0}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm">Breaks Taken</div>
            <div className="font-bold text-2xl">
              {userStats?.breaksTaken || 0}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium text-lg mb-2">Recent Activity</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Date</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Duration</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Coins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.slice(0, 5).map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(session.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDuration(session.duration)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {session.coinsEarned}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-sm text-gray-500">No study sessions yet</TableCell>
                    <TableCell className="text-sm text-gray-500">-</TableCell>
                    <TableCell className="text-sm text-gray-500">-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

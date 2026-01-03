import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Briefcase, Camera } from "lucide-react";

interface WorkerProps {
    worker: {
        id: string;
        name: string;
        phone: string;
        job_role: string;
        worker_status: string;
        profile_photo?: string;
        active_orders?: string[];
    };
    onUpdatePhoto: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    onEdit: (worker: any) => void;
}

export const WorkerCard = ({ worker, onUpdatePhoto, onStatusChange, onEdit }: WorkerProps) => {
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'online':
                return <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>;
            case 'busy':
                return <Badge variant="destructive">Busy</Badge>;
            case 'on_break':
                return <Badge variant="outline" className="border-orange-500 text-orange-500">On Break</Badge>;
            default:
                return <Badge variant="secondary">Offline</Badge>;
        }
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="relative group">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                        <AvatarImage src={worker.profile_photo} alt={worker.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary">
                            <User className="h-8 w-8" />
                        </AvatarFallback>
                    </Avatar>
                    <button
                        onClick={() => onUpdatePhoto(worker.id)}
                        className="absolute bottom-0 right-0 p-1.5 bg-background border rounded-full shadow-sm hover:bg-muted transition-colors"
                    >
                        <Camera className="h-3 w-3 text-muted-foreground" />
                    </button>
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{worker.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(worker.worker_status)}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{worker.job_role || "General Worker"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{worker.phone || "No phone"}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => onStatusChange(worker.id, worker.worker_status === 'online' ? 'offline' : 'online')}
                    >
                        {worker.worker_status === 'online' ? 'Set Offline' : 'Set Online'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => onEdit(worker)}
                    >
                        Edit Profile
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

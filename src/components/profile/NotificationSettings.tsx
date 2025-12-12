import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { UserProfile } from "@/Contexts/UserService";
import { toast } from "sonner";

interface NotificationSettingsProps {
    user: UserProfile;
}

export const NotificationSettings = ({ user }: NotificationSettingsProps) => {
    const handleNotificationChange = (key: string, channel: string, checked: boolean) => {
        // In a real app, you would call an API here to update the user's preferences
        // For now, we just toast
        toast.info(`Notification preference updated locally`);
    };

    const notificationConfig = [
        {
            title: "Booking Confirmations",
            description: "Receive confirmation when your booking is accepted",
            key: "bookingConfirmations",
            channels: ["email", "sms", "push"],
        },
        {
            title: "Booking Reminders",
            description: "Get reminders before your scheduled service",
            key: "bookingReminders",
            channels: ["email", "sms", "push"],
        },
        {
            title: "Booking Updates",
            description: "Status changes and service updates",
            key: "bookingUpdates",
            channels: ["email", "sms", "push"],
        },
        {
            title: "Promotional Offers",
            description: "Special deals and discounts",
            key: "promotionalOffers",
            channels: ["email", "sms"],
        },
        {
            title: "News & Updates",
            description: "New features and service announcements",
            key: "newsUpdates",
            channels: ["email"],
        },
        {
            title: "Security Alerts",
            description: "Login attempts and account changes",
            key: "securityAlerts",
            channels: ["email", "sms"],
            disabled: true,
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <p className="text-sm text-[#6B7280]">
                    Choose how you want to receive updates
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {notificationConfig.map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between py-4 border-b last:border-b-0">
                        <div>
                            <h4 className="font-semibold">{notif.title}</h4>
                            <p className="text-sm text-[#6B7280]">{notif.description}</p>
                        </div>
                        <div className="flex gap-4">
                            {notif.channels.map((channel) => (
                                <div key={channel} className="flex flex-col items-center">
                                    <Label className="text-sm capitalize mb-2">{channel}</Label>
                                    <Switch
                                        defaultChecked={
                                            // Safe access or default to true
                                            user.notifications?.[notif.key as keyof typeof user.notifications]?.[channel] ?? true
                                        }
                                        onCheckedChange={(checked) =>
                                            handleNotificationChange(notif.key, channel, checked)
                                        }
                                        disabled={notif.disabled}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <Button
                    className="w-full sm:w-auto"
                    onClick={() => toast.success("Notification preferences saved")}
                >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                </Button>
            </CardContent>
        </Card>
    );
};

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Filter, Search } from "lucide-react";
import { logUpdate, logSystem } from "@/utils/auditLog";
import AuditLogSettings from "./settings/AuditLogSettings";
import OptimizationSettings from "./settings/OptimizationSettings";

// Form schema for general settings
const generalSettingsSchema = z.object({
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  currentAcademicYear: z.string({
    required_error: "Please select the current academic year.",
  }),
  currentTerm: z.string({
    required_error: "Please select the current term.",
  }),
  primaryColor: z.string().min(1, {
    message: "Primary color is required.",
  }),
  themeMode: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme mode.",
  }),
});

// Form schema for account settings
const accountSettingsSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.string({
    required_error: "Please select a role.",
  }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Form schema for email settings
const emailSettingsSchema = z.object({
  emailFromName: z.string().min(2, {
    message: "From name must be at least 2 characters.",
  }),
  emailFromAddress: z.string().email({
    message: "Please enter a valid email address.",
  }),
  smtpHost: z.string().min(1, {
    message: "SMTP host is required.",
  }),
  smtpPort: z.string().regex(/^\d+$/, {
    message: "SMTP port must be a number.",
  }),
  smtpUsername: z.string().min(1, {
    message: "SMTP username is required.",
  }),
  smtpPassword: z.string().min(1, {
    message: "SMTP password is required.",
  }),
  emailNotifications: z.boolean().default(true),
  notifyOnNewStudent: z.boolean().default(true),
  notifyOnNewSponsor: z.boolean().default(true),
  notifyOnSponsorshipChange: z.boolean().default(true),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;

// Mock audit log data
const auditLogs = [
  { id: 1, user: "Admin User", action: "Created student", entity: "Student", entityId: "STU001", timestamp: "2025-04-21 09:45:23", details: "Created new student John Doe" },
  { id: 2, user: "Manager User", action: "Updated sponsor", entity: "Sponsor", entityId: "SPO003", timestamp: "2025-04-21 08:30:15", details: "Updated sponsor status to active" },
  { id: 3, user: "Admin User", action: "Added exam score", entity: "Exam", entityId: "EX005", timestamp: "2025-04-20 14:22:10", details: "Added score for Math Final Exam" },
  { id: 4, user: "Admin User", action: "Updated student", entity: "Student", entityId: "STU042", timestamp: "2025-04-20 11:15:55", details: "Updated student address" },
  { id: 5, user: "Manager User", action: "Created sponsor", entity: "Sponsor", entityId: "SPO011", timestamp: "2025-04-19 16:05:30", details: "Created new sponsor Jane Smith" },
  { id: 6, user: "Admin User", action: "Updated system settings", entity: "Settings", entityId: "SYS001", timestamp: "2025-04-19 10:22:40", details: "Updated academic year to 2025-2026" },
  { id: 7, user: "Admin User", action: "Created exam", entity: "Exam", entityId: "EX006", timestamp: "2025-04-18 15:10:12", details: "Created new Science Mid-term Exam" },
  { id: 8, user: "Manager User", action: "Assigned student to sponsor", entity: "Sponsorship", entityId: "SHI009", timestamp: "2025-04-18 09:25:35", details: "Assigned student STU005 to sponsor SPO003" },
];

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Default form values
  const generalDefaultValues: GeneralSettingsValues = {
    organizationName: "David's Hope International",
    currentAcademicYear: "2023-2024",
    currentTerm: "Term 1",
    primaryColor: "#9b87f5",
    themeMode: "light",
  };

  const accountDefaultValues: AccountSettingsValues = {
    name: "Admin User",
    email: "admin@davidshope.org",
    role: "admin",
    password: "",
    confirmPassword: "",
  };

  const emailDefaultValues: EmailSettingsValues = {
    emailFromName: "David's Hope International",
    emailFromAddress: "noreply@davidshope.org",
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpUsername: "smtp-user",
    smtpPassword: "********",
    emailNotifications: true,
    notifyOnNewStudent: true,
    notifyOnNewSponsor: true,
    notifyOnSponsorshipChange: true,
  };

  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: generalDefaultValues,
  });

  const accountForm = useForm<AccountSettingsValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: accountDefaultValues,
  });

  const emailForm = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: emailDefaultValues,
  });

  const onGeneralSubmit = async (data: GeneralSettingsValues) => {
    try {
      console.log("General settings updated:", data);
      
      // Log the settings update
      await logSystem('settings', 'general', `Updated general settings: ${JSON.stringify(data)}`);
      
      toast({
        title: "Settings updated",
        description: "General settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating general settings:", error);
      toast({
        title: "Error",
        description: "Failed to update general settings.",
        variant: "destructive"
      });
    }
  };

  const onAccountSubmit = async (data: AccountSettingsValues) => {
    try {
      console.log("Account settings updated:", data);
      
      // Log the account update
      await logUpdate('user_account', 'current', `Updated account settings for user: ${data.email}`);
      
      toast({
        title: "Account updated",
        description: "Your account settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating account settings:", error);
      toast({
        title: "Error",
        description: "Failed to update account settings.",
        variant: "destructive"
      });
    }
  };

  const onEmailSubmit = async (data: EmailSettingsValues) => {
    try {
      console.log("Email settings updated:", data);
      
      // Log the email settings update
      await logSystem('settings', 'email', `Updated email settings: SMTP host ${data.smtpHost}, notifications enabled: ${data.emailNotifications}`);
      
      toast({
        title: "Email settings updated",
        description: "Email settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      toast({
        title: "Error",
        description: "Failed to update email settings.",
        variant: "destructive"
      });
    }
  };

  // Filter audit logs based on search term
  const filteredAuditLogs = auditLogs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="smtp">Email & SMTP</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your organization and application settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={generalForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be displayed throughout the application.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="currentAcademicYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Academic Year</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select academic year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2023-2024">2023-2024</SelectItem>
                              <SelectItem value="2022-2023">2022-2023</SelectItem>
                              <SelectItem value="2021-2022">2021-2022</SelectItem>
                              <SelectItem value="2020-2021">2020-2021</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The academic year for all reports and records.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="currentTerm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Term</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select term" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Term 1">Term 1</SelectItem>
                              <SelectItem value="Term 2">Term 2</SelectItem>
                              <SelectItem value="Term 3">Term 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The current school term.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />
                  <h3 className="text-lg font-medium">Appearance</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="themeMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme Mode</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select theme mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the theme mode for the application.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-16 h-10" />
                            </FormControl>
                            <Input 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="flex-1"
                            />
                          </div>
                          <FormDescription>
                            Select the primary color for the application.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <label
                        htmlFor="app-logo"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Application Logo
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Upload your organization's logo (recommended size: 200x60px)
                      </p>
                    </div>
                    <Button type="button" variant="outline">
                      Upload
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save General Settings</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        
        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-6">
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={accountForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={accountForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="superuser">Superuser</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          User role determines access permissions in the system.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                  <h3 className="text-lg font-medium">Change Password</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={accountForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank to keep current password.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save Account Settings</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        
        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/20 p-6 text-primary">
                  <span className="text-3xl font-semibold">AU</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Profile Picture</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm">Upload</Button>
                    <Button type="button" variant="outline" size="sm">Remove</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea 
                  placeholder="Tell us a little about yourself" 
                  className="resize-none h-20"
                />
                <p className="text-sm text-muted-foreground">Brief description for your profile.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Input placeholder="e.g. Administrator" />
                <p className="text-sm text-muted-foreground">Your role or position in the organization.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input placeholder="e.g. +1 234 567 8901" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Profile</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Email & SMTP Settings Tab */}
        <TabsContent value="smtp" className="space-y-6">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>SMTP Settings</CardTitle>
                  <CardDescription>
                    Configure your email server settings for notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="emailFromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The name that will appear in email notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="emailFromAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormDescription>
                            The email address that will be used to send notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="smtpUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="button" variant="outline" className="mt-2">
                    Test SMTP Connection
                  </Button>

                  <Separator />
                  <h3 className="text-lg font-medium">Notification Settings</h3>

                  <FormField
                    control={emailForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Enable email notifications for system events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormField
                      control={emailForm.control}
                      name="notifyOnNewStudent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>New Student Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications when new students are added
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="notifyOnNewSponsor"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>New Sponsor Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications when new sponsors are added
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="notifyOnSponsorshipChange"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Sponsorship Change Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications when sponsorship changes occur
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save Email Settings</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <AuditLogSettings />
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <OptimizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

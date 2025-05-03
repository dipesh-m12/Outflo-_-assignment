"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Users,
  Briefcase,
  MapPin,
  FileText,
  Send,
  Copy,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Zod schemas for validation
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().min(1, "Description is required"),
  leads: z.string().optional(),
  accountIDs: z.string().optional(),
});

const messageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  job_title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional(),
  summary: z.string().optional(),
});

export default function Home() {
  // State for campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");

  // State for personalized message
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Campaign form
  const campaignForm = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      leads: "",
      accountIDs: "",
    },
  });

  // Message form
  const messageForm = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      name: "John Doe",
      job_title: "Software Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      summary: "Experienced in AI & ML...",
    },
  });

  // Fetch campaigns
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/campaigns`);
      if (res.data.success) {
        setCampaigns(res.data.data);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to fetch campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Create campaign
  const createCampaign = async (data: any) => {
    setIsLoading(true);
    try {
      const leads = data.leads
        .split(",")
        .map((lead: any) => lead.trim())
        .filter(Boolean);
      const accountIDs = data.accountIDs
        .split(",")
        .map((id: any) => id.trim())
        .filter(Boolean);
      const res = await axios.post(`${API_URL}/campaigns`, {
        ...data,
        leads,
        accountIDs,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        campaignForm.reset();
        fetchCampaigns();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to create campaign");
    } finally {
      setIsLoading(false);
    }
  };

  // Update campaign
  const updateCampaign = async (data: any) => {
    if (!editCampaign) return;
    setIsLoading(true);
    try {
      const leads = data.leads
        .split(",")
        .map((lead: any) => lead.trim())
        .filter(Boolean);
      const accountIDs = data.accountIDs
        .split(",")
        .map((id: any) => id.trim())
        .filter(Boolean);
      const res = await axios.put(`${API_URL}/campaigns/${editCampaign._id}`, {
        ...data,
        leads,
        accountIDs,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setEditCampaign(null);
        campaignForm.reset();
        fetchCampaigns();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update campaign");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete campaign
  const deleteCampaign = async (id: any) => {
    setIsLoading(true);
    try {
      const res = await axios.delete(`${API_URL}/campaigns/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCampaigns();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to delete campaign");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle campaign status
  const toggleStatus = async (campaign: any) => {
    setIsLoading(true);
    try {
      const newStatus = campaign.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await axios.put(`${API_URL}/campaigns/${campaign._id}`, {
        ...campaign,
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCampaigns();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate personalized message
  const generateMessage = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/personalizedmessage`, data);
      if (res.data.success) {
        setGeneratedMessage(res.data.data.message);
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to generate message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit campaign
  const handleEditCampaign = (campaign: any) => {
    setEditCampaign(campaign);
    campaignForm.reset({
      name: campaign.name,
      description: campaign.description,
      leads: campaign.leads.join(","),
      accountIDs: campaign.accountIDs.join(","),
    });
  };

  // Copy message to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopySuccess(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Toaster position="top-right" />

      <div className="container mx-auto p-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Campaign Manager
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Manage your outreach campaigns and generate personalized LinkedIn
            messages
          </p>
        </div>

        <Tabs
          defaultValue="campaigns"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="campaigns" className="text-base">
              <Users className="w-4 h-4 mr-2" />
              Campaign Management
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-base">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Generator
            </TabsTrigger>
          </TabsList>

          {/* Campaign Management Tab */}
          <TabsContent value="campaigns" className="space-y-8">
            <div className="grid md:grid-cols-[350px_1fr] gap-8">
              {/* Campaign Form */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    {editCampaign ? (
                      <>
                        <Edit className="w-5 h-5 mr-2 text-amber-500" />
                        Edit Campaign
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5 mr-2 text-emerald-500" />
                        New Campaign
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {editCampaign
                      ? "Update your campaign details below"
                      : "Create a new outreach campaign"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...campaignForm}>
                    <form
                      onSubmit={campaignForm.handleSubmit(
                        editCampaign ? updateCampaign : createCampaign
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={campaignForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter campaign name"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter description"
                                {...field}
                                disabled={isLoading}
                                className="resize-none min-h-[100px] border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="leads"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Leads (comma-separated URLs)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., https://linkedin.com/in/profile-1, profile-2"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="accountIDs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account IDs (comma-separated)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 123, 456"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2 pt-2">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className={`${
                            editCampaign
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {editCampaign ? "Updating..." : "Creating..."}
                            </>
                          ) : editCampaign ? (
                            "Update Campaign"
                          ) : (
                            "Create Campaign"
                          )}
                        </Button>
                        {editCampaign && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditCampaign(null);
                              campaignForm.reset({
                                name: "",
                                description: "",
                                leads: "",
                                accountIDs: "",
                              });
                            }}
                            disabled={isLoading}
                            className="border-slate-300 dark:border-slate-700"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Campaigns List */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Your Campaigns</CardTitle>
                    <Badge variant="outline" className="font-normal">
                      {campaigns.length}{" "}
                      {campaigns.length === 1 ? "campaign" : "campaigns"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Manage and track your outreach campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading && !campaigns.length ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] pr-4">
                      {campaigns.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                            <TableRow>
                              <TableHead className="w-[180px]">Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-[100px] text-center">
                                Status
                              </TableHead>
                              <TableHead className="w-[180px] text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {campaigns.map((campaign: any) => (
                              <TableRow key={campaign._id} className="group">
                                <TableCell className="font-medium">
                                  {campaign.name}
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate">
                                  {campaign.description}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      campaign.status === "ACTIVE"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`
                                      ${
                                        campaign.status === "ACTIVE"
                                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                          : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                      }
                                      cursor-pointer
                                    `}
                                    onClick={() => toggleStatus(campaign)}
                                  >
                                    {campaign.status === "ACTIVE" ? (
                                      <CheckCircle className="w-3 h-3 mr-1 inline" />
                                    ) : (
                                      <XCircle className="w-3 h-3 mr-1 inline" />
                                    )}
                                    {campaign.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        handleEditCampaign(campaign);
                                        // On mobile, switch to the form section
                                        if (window.innerWidth < 768) {
                                          const formElement =
                                            document.querySelector("form");
                                          if (formElement) {
                                            formElement.scrollIntoView({
                                              behavior: "smooth",
                                            });
                                          }
                                        }
                                      }}
                                      disabled={isLoading}
                                      className="border-slate-300 dark:border-slate-700"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={isLoading}
                                          className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Campaign
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete the
                                            campaign "{campaign.name}"? This
                                            action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              deleteCampaign(campaign._id)
                                            }
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-700">
                          <div className="flex justify-center mb-4">
                            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            No campaigns yet
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                            Create your first campaign to start organizing your
                            outreach efforts
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Campaign Details Section */}
            {campaigns.length > 0 && (
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Campaign Details</CardTitle>
                  <CardDescription>
                    Detailed information about your campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-6">
                      {campaigns.map((campaign: any) => (
                        <div
                          key={`details-${campaign._id}`}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {campaign.name}
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {campaign.description}
                              </p>
                            </div>
                            <Badge
                              variant={
                                campaign.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                              className={`
                                ${
                                  campaign.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-800"
                                }
                              `}
                            >
                              {campaign.status}
                            </Badge>
                          </div>

                          <Separator className="my-3" />

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">
                                Leads
                              </h4>
                              {campaign.leads && campaign.leads.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                  {campaign.leads.map(
                                    (lead: string, index: number) => (
                                      <li key={index} className="truncate">
                                        • {lead}
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400">
                                  No leads added
                                </p>
                              )}
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">
                                Account IDs
                              </h4>
                              {campaign.accountIDs &&
                              campaign.accountIDs.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                  {campaign.accountIDs.map(
                                    (id: string, index: number) => (
                                      <li key={index}>• {id}</li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400">
                                  No account IDs added
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Message Generator Tab */}
          <TabsContent value="messages">
            <div className="grid md:grid-cols-[1fr_1fr] gap-8">
              {/* Message Form */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-purple-500" />
                    LinkedIn Message Generator
                  </CardTitle>
                  <CardDescription>
                    Create personalized outreach messages for LinkedIn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...messageForm}>
                    <form
                      onSubmit={messageForm.handleSubmit(generateMessage)}
                      className="space-y-4"
                    >
                      <FormField
                        control={messageForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-slate-400" />
                              Recipient Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter name"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={messageForm.control}
                        name="job_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                              Job Title
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter job title"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={messageForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                              Company
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter company"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={messageForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                              Location
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter location"
                                {...field}
                                disabled={isLoading}
                                className="border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={messageForm.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-slate-400" />
                              Profile Summary
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter profile summary or key points"
                                {...field}
                                disabled={isLoading}
                                className="resize-none min-h-[100px] border-slate-300 dark:border-slate-700"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Generate Personalized Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Generated Message */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-cyan-500" />
                    Generated Message
                  </CardTitle>
                  <CardDescription>
                    Your personalized outreach message for LinkedIn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedMessage ? (
                    <div className="space-y-4">
                      <div className="relative p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[300px]">
                        <div className="prose dark:prose-invert">
                          <p>{generatedMessage}</p>
                        </div>
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          size="sm"
                          className="absolute top-4 right-4 border-slate-300 dark:border-slate-700"
                        >
                          {copySuccess ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveTab("campaigns");
                            toast.success(
                              "Switch to Campaigns tab to start your outreach!"
                            );
                          }}
                          className="border-slate-300 dark:border-slate-700"
                        >
                          Use in Campaign
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-700">
                      <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No message generated yet
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md">
                        Fill out the form to generate a personalized LinkedIn
                        message based on the recipient's profile
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

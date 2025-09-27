"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import moment from "moment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getOrganizationClientsForCalendar,
  getOrganizationPumpTypesForCalendar,
} from "@/lib/actions/calendar";
import { getActiveDrivers } from "@/lib/actions/calendar";
import { getStatusLabel } from "@/lib/types/calendar";
import { toast } from "@/components/ui/use-toast";
import { User, Building2, Truck, Trash2, Navigation, Plus } from "lucide-react";
import type { CalendarJob, JobStatus } from "@/lib/types/calendar";
import { CreateClientModal } from "./create-client-modal";
import { AddressWithMap } from "./address-with-map";

const jobSchema = z.object({
  client_id: z.string().optional(),
  pumpist_id: z.string().optional(),
  pump_type_id: z.string().optional(),
  status: z.enum([
    "to_plan",
    "planned",
    "planned_own_concrete",
    "en_route",
    "arrived",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  volume_m3: z.number().min(0).optional(),
  pipe_length: z.number().min(0).optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_postal_code: z.string().optional(),
  travel_time_minutes: z.number().min(0).optional(),
  notes: z.string().optional(),
  dispatcher_notes: z.string().optional(),
  pumpist_notes: z.string().optional(),
  is_concrete_supplier_job: z.boolean(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobModalProps {
  job: CalendarJob | null;
  mode: "create" | "edit";
  organizationSlug: string;
  selectedDate: string;
  clickedTime?: string; // Time from calendar click
  onSave: (data: Partial<CalendarJob>) => void;
  onDelete: (jobId: string) => void;
  onClose: () => void;
}

export function JobModal({
  job,
  mode,
  organizationSlug,
  selectedDate,
  clickedTime,
  onSave,
  onDelete,
  onClose,
}: JobModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [drivers, setDrivers] = useState<
    Array<{ id: string; first_name: string; last_name: string }>
  >([]);
  const [pumpTypes, setPumpTypes] = useState<
    Array<{ id: string; name: string; capacity: number }>
  >([]);
  const [activeTab, setActiveTab] = useState("details");
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  // Function to add hours to a time string using moment
  const addHoursToTime = (timeString: string, hours: number): string => {
    if (!timeString) return "";
    return moment(timeString, "HH:mm").add(hours, "hours").format("HH:mm");
  };

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      client_id: job?.client_id || "",
      pumpist_id: job?.pumpist_id || "",
      pump_type_id: job?.pump_type_id || "",
      status: job?.status || "to_plan",
      departure_time: job?.departure_time || "",
      arrival_time: job?.arrival_time || "",
      start_time:
        job?.start_time ||
        (mode === "create" && clickedTime ? clickedTime : ""),
      end_time:
        job?.end_time ||
        (mode === "create" && clickedTime
          ? addHoursToTime(clickedTime, 2)
          : ""),
      volume_m3: job?.volume_m3 || undefined,
      pipe_length: job?.pipe_length || undefined,
      address_street: job?.address_street || "",
      address_city: job?.address_city || "",
      address_postal_code: job?.address_postal_code || "",
      travel_time_minutes: job?.travel_time_minutes || undefined,
      notes: job?.notes || "",
      dispatcher_notes: job?.dispatcher_notes || "",
      pumpist_notes: job?.pumpist_notes || "",
      is_concrete_supplier_job: job?.is_concrete_supplier_job || false,
    },
  });

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [clientsData, driversData, pumpTypesData] = await Promise.all([
          getOrganizationClientsForCalendar(organizationSlug),
          getActiveDrivers(organizationSlug),
          getOrganizationPumpTypesForCalendar(organizationSlug),
        ]);

        setClients(clientsData);
        setDrivers(driversData);
        setPumpTypes(pumpTypesData);
      } catch (error) {
        console.error("Error loading form data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organizationSlug]);

  const onSubmit = (data: JobFormData) => {
    onSave(data);
  };

  const handleDelete = () => {
    if (job && window.confirm("Are you sure you want to delete this job?")) {
      onDelete(job.id);
    }
  };

  const calculateTravelTime = async () => {
    const address = form.getValues();
    const fullAddress =
      `${address.address_street}, ${address.address_city}, ${address.address_postal_code}`.trim();

    if (!fullAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter an address to calculate travel time",
        variant: "destructive",
      });
      return;
    }

    // This is a placeholder - in a real app, you'd integrate with a routing service
    const estimatedTime = Math.floor(Math.random() * 60) + 15; // Random 15-75 minutes
    form.setValue("travel_time_minutes", estimatedTime);

    toast({
      title: "Travel Time Calculated",
      description: `Estimated travel time: ${estimatedTime} minutes`,
    });
  };

  const handleClientCreated = async (newClient: {
    id: string;
    name: string;
  }) => {
    // Refresh the clients list
    try {
      const clientsData = await getOrganizationClientsForCalendar(
        organizationSlug
      );
      setClients(clientsData);
      // Set the newly created client as selected
      form.setValue("client_id", newClient.id);
      setShowCreateClientModal(false);
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    } catch (error) {
      console.error("Error refreshing clients list:", error);
      toast({
        title: "Error",
        description: "Failed to refresh clients list",
        variant: "destructive",
      });
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    // Location coordinates are now handled by the AddressWithMap component
    console.log("Location updated:", { lat, lng });
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]" title="Loading...">
          <DialogTitle className="sr-only">Loading...</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose} modal={false}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target && (target.closest('.pac-container') || target.classList.contains('pac-item'))) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? "Create New Job" : "Edit Job"}
            {job && (
              <Badge variant="outline">{getStatusLabel(job.status)}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Create a new job for ${selectedDate}`
              : "Update job details and scheduling"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Job Details</TabsTrigger>
              <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Start and End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...form.register("start_time")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    {...form.register("end_time")}
                  />
                </div>
              </div>
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={form.watch("client_id")}
                  onValueChange={(value) => form.setValue("client_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="create_new"
                      onSelect={() => setShowCreateClientModal(true)}
                    >
                      <div className="flex items-center gap-2 text-blue-600">
                        <Plus className="h-4 w-4" />
                        Create New Client
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address with Map */}
              <AddressWithMap
                street={form.watch("address_street") || ""}
                city={form.watch("address_city") || ""}
                postalCode={form.watch("address_postal_code") || ""}
                onStreetChange={(value) =>
                  form.setValue("address_street", value)
                }
                onCityChange={(value) => form.setValue("address_city", value)}
                onPostalCodeChange={(value) =>
                  form.setValue("address_postal_code", value)
                }
                onLocationChange={handleLocationChange}
              />
              {/* Volume and Pipe Length */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume_m3">Volume (m³)</Label>
                  <Input
                    id="volume_m3"
                    type="number"
                    {...form.register("volume_m3", { valueAsNumber: true })}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pipe_length">Pipe Length (m)</Label>
                  <Input
                    id="pipe_length"
                    type="number"
                    {...form.register("pipe_length", { valueAsNumber: true })}
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Pump Type */}
              <div className="space-y-2">
                <Label htmlFor="pump_type_id">Pump Type</Label>
                <Select
                  value={form.watch("pump_type_id")}
                  onValueChange={(value) =>
                    form.setValue("pump_type_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pump type" />
                  </SelectTrigger>
                  <SelectContent>
                    {pumpTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {type.name} ({type.capacity}m³/hr)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value: JobStatus) =>
                    form.setValue("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="te_plannen">To Plan</SelectItem>
                    <SelectItem value="gepland">Planned</SelectItem>
                    <SelectItem value="gepland_eigen_beton">
                      Planned (Own Concrete)
                    </SelectItem>
                    <SelectItem value="onderweg">En Route</SelectItem>
                    <SelectItem value="aangekomen">Arrived</SelectItem>
                    <SelectItem value="bezig">In Progress</SelectItem>
                    <SelectItem value="voltooid">Completed</SelectItem>
                    <SelectItem value="geannuleerd">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Assignment */}
              <div className="space-y-2">
                <Label htmlFor="pumpist_id">Driver/Pumpist</Label>
                <Select
                  value={form.watch("pumpist_id")}
                  onValueChange={(value) => form.setValue("pumpist_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {driver.first_name} {driver.last_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time</Label>
                  <Input
                    id="departure_time"
                    type="time"
                    {...form.register("departure_time")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrival_time">Arrival Time</Label>
                  <Input
                    id="arrival_time"
                    type="time"
                    {...form.register("arrival_time")}
                  />
                </div>
              </div>

              {/* Travel Time */}
              <div className="space-y-2">
                <Label htmlFor="travel_time_minutes">
                  Travel Time (minutes)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="travel_time_minutes"
                    type="number"
                    {...form.register("travel_time_minutes", {
                      valueAsNumber: true,
                    })}
                    placeholder="30"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateTravelTime}
                    className="flex items-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    Calculate
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Enter any general notes about this job..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispatcher_notes">Dispatcher Notes</Label>
                <Textarea
                  id="dispatcher_notes"
                  {...form.register("dispatcher_notes")}
                  placeholder="Notes for internal coordination..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pumpist_notes">Pumpist Notes</Label>
                <Textarea
                  id="pumpist_notes"
                  {...form.register("pumpist_notes")}
                  placeholder="Notes for the pump operator..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {mode === "edit" && job && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Job
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Create Job" : "Update Job"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Create Client Modal */}
      <CreateClientModal
        open={showCreateClientModal}
        onOpenChange={setShowCreateClientModal}
        organizationSlug={organizationSlug}
        onClientCreated={handleClientCreated}
      />
    </Dialog>
  );
}

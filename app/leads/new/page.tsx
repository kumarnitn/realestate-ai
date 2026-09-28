import React from "react";
import LeadForm from '@/components/leads/LeadForm';

export default function NewLeadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Lead</h1>
      <LeadForm />
    </div>
  );
}

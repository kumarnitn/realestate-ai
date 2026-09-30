import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';
import { Property } from '@/types/property';
import { parsePriceToLakhs } from '../pricing';
export { parsePriceToLakhs };

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'properties.json');

function readLocalProperties(): Property[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as Property[];
  } catch (err) {
    console.error('Error reading local properties:', err);
    return [];
  }
}

function writeLocalProperties(properties: Property[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(properties, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local properties:', err);
  }
}

/**
 * Fetch all properties from Supabase or fallback to local JSON file
 */
export async function getProperties(): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        propertyType: row.property_type,
        location: row.location,
        price: row.price,
        numericPrice: row.numeric_price ? Number(row.numeric_price) : parsePriceToLakhs(row.price),
        areaSqft: row.area_sqft ? Number(row.area_sqft) : undefined,
        status: row.status || 'Available',
        amenities: Array.isArray(row.amenities) ? row.amenities : [],
        description: row.description || '',
        floorNumber: row.floor_number || '',
        possessionStatus: row.possession_status || 'Ready to Move',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  } catch (err) {
    // If Supabase table is not yet created or throws, fall back to local storage
  }

  return readLocalProperties();
}

/**
 * Add a new property to inventory
 */
export async function addProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
  const newId = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const numericPrice = propertyData.numericPrice || parsePriceToLakhs(propertyData.price);

  const newProperty: Property = {
    ...propertyData,
    id: newId,
    numericPrice,
    createdAt: now,
    updatedAt: now,
  };

  // Attempt Supabase insert
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        id: newProperty.id,
        title: newProperty.title,
        property_type: newProperty.propertyType,
        location: newProperty.location,
        price: newProperty.price,
        numeric_price: newProperty.numericPrice,
        area_sqft: newProperty.areaSqft,
        status: newProperty.status,
        amenities: newProperty.amenities,
        description: newProperty.description,
        floor_number: newProperty.floorNumber,
        possession_status: newProperty.possessionStatus,
      }])
      .select()
      .single();

    if (!error && data) {
      // Also update local cache for offline resiliency
      const local = readLocalProperties();
      writeLocalProperties([newProperty, ...local]);
      return newProperty;
    }
  } catch (err) {
    // Supabase table may not exist, fallback to local file
  }

  // Fallback to local storage
  const local = readLocalProperties();
  const updated = [newProperty, ...local];
  writeLocalProperties(updated);
  return newProperty;
}

/**
 * Delete a property by ID
 */
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    await supabase.from('properties').delete().eq('id', id);
  } catch {
    // Ignore
  }

  const local = readLocalProperties();
  const filtered = local.filter((p) => p.id !== id);
  writeLocalProperties(filtered);
  return true;
}

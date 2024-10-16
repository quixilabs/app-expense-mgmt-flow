'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/utils/supabase'

interface Business {
  id: string
  name: string
}

export default function BusinessManager() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [newBusinessName, setNewBusinessName] = useState('')
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('name')

      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error fetching businesses:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch businesses.',
        variant: 'destructive',
      })
    }
  }

  const addBusiness = async () => {
    if (!newBusinessName.trim()) return
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({ name: newBusinessName.trim() })
        .select()

      if (error) throw error
      setBusinesses([...businesses, data[0]])
      setNewBusinessName('')
      toast({
        title: 'Success',
        description: 'Business added successfully.',
      })
    } catch (error) {
      console.error('Error adding business:', error)
      toast({
        title: 'Error',
        description: 'Failed to add business.',
        variant: 'destructive',
      })
    }
  }

  const removeBusiness = async (id: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id)

      if (error) throw error
      setBusinesses(businesses.filter(b => b.id !== id))
      toast({
        title: 'Success',
        description: 'Business removed successfully.',
      })
    } catch (error) {
      console.error('Error removing business:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove business.',
        variant: 'destructive',
      })
    }
  }

  const startEditing = (business: Business) => {
    setEditingBusiness(business)
    setNewBusinessName(business.name)
  }

  const updateBusiness = async () => {
    if (!editingBusiness || !newBusinessName.trim()) return
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({ name: newBusinessName.trim() })
        .eq('id', editingBusiness.id)
        .select()

      if (error) throw error
      setBusinesses(businesses.map(b => b.id === editingBusiness.id ? data[0] : b))
      setEditingBusiness(null)
      setNewBusinessName('')
      toast({
        title: 'Success',
        description: 'Business updated successfully.',
      })
    } catch (error) {
      console.error('Error updating business:', error)
      toast({
        title: 'Error',
        description: 'Failed to update business.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Manage Businesses</h3>
      <div className="flex space-x-2">
        <Input
          value={newBusinessName}
          onChange={(e) => setNewBusinessName(e.target.value)}
          placeholder="Enter business name"
        />
        {editingBusiness ? (
          <Button onClick={updateBusiness}>Update</Button>
        ) : (
          <Button onClick={addBusiness}>Add</Button>
        )}
      </div>
      <ul className="space-y-2">
        {businesses.map((business) => (
          <li key={business.id} className="flex items-center justify-between bg-secondary p-2 rounded">
            <span>{business.name}</span>
            <div className="space-x-2">
              <Button onClick={() => startEditing(business)} variant="outline" size="sm">
                Edit
              </Button>
              <Button onClick={() => removeBusiness(business.id)} variant="destructive" size="sm">
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

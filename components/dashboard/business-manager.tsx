'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { addBusiness, getBusinesses, updateBusiness as updateBusinessUtil, removeBusiness as removeBusinessUtil } from '@/utils/storeUtils'
import { useUser } from '@clerk/nextjs'

interface Business {
  id: string
  name: string
  user_id: string
}

export default function BusinessManager() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [newBusinessName, setNewBusinessName] = useState('')
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const { toast } = useToast()
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      fetchBusinesses()
    }
  }, [user])

  const fetchBusinesses = async () => {
    if (!user) return
    try {
      const data = await getBusinesses(user.id)
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

  const handleAddBusiness = async () => {
    if (!newBusinessName.trim() || !user) return
    try {
      const data = await addBusiness(newBusinessName.trim(), user.id)
      setBusinesses([...businesses, data])
      setNewBusinessName('')
      toast({
        title: 'Success',
        description: 'Business added successfully.',
      })
    } catch (error: any) {
      console.error('Error adding business:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add business.',
        variant: 'destructive',
      })
    }
  }

  const removeBusiness = async (id: string) => {
    if (!user) return
    try {
      await removeBusinessUtil(id, user.id)
      setBusinesses(businesses.filter(b => b.id !== id))
      toast({
        title: 'Success',
        description: 'Business removed successfully.',
      })
    } catch (error: any) {
      console.error('Error removing business:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove business.',
        variant: 'destructive',
      })
    }
  }

  const startEditing = (business: Business) => {
    setEditingBusiness(business)
    setNewBusinessName(business.name)
  }

  const updateBusiness = async () => {
    if (!editingBusiness || !newBusinessName.trim() || !user) return
    try {
      const updatedBusiness = await updateBusinessUtil(editingBusiness.id, { name: newBusinessName.trim() }, user.id)
      setBusinesses(businesses.map(b => b.id === editingBusiness.id ? updatedBusiness : b))
      setEditingBusiness(null)
      setNewBusinessName('')
      toast({
        title: 'Success',
        description: 'Business updated successfully.',
      })
    } catch (error: any) {
      console.error('Error updating business:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update business.',
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
          <Button onClick={handleAddBusiness}>Add</Button>
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

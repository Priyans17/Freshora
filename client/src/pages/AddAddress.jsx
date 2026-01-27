import React, { useState, useCallback } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Move InputField outside component to prevent recreation on each render
const InputField = React.memo(({ type, placeholder, name, value, onChange }) => (
  <input
    className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition"
    type={type}
    placeholder={placeholder}
    name={name}
    onChange={onChange}
    value={value}
    required
  />
))

InputField.displayName = 'InputField'

const AddAddress = () => {
  const { user, axios } = useAppContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  })

  // Use useCallback to memoize the handler
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setAddress(prev => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please login to add address");
      return;
    }

    setLoading(true);
    try {
      // Convert zipCode and phone to numbers before sending
      const addressData = {
        ...address,
        email: address.email || user.email,
        zipCode: address.zipCode ? Number(address.zipCode) : '',
        phone: address.phone ? Number(address.phone) : ''
      };

      const { data } = await axios.post("/api/address", {
        address: addressData
      });

      if (data.success) {
        toast.success("Address added successfully!");
        navigate("/cart");
      } else {
        toast.error(data.message || "Failed to add address");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-16 pb-16">
      <p className="text-2xl md:text-3xl text-gray-500">
        Add Shipping <span className="font-semibold text-primary">Address</span>
      </p>

      <div className="flex flex-col-reverse md:flex-row justify-between mt-10">
        <div className="flex-1 max-w-md">
          <form onSubmit={onSubmitHandler} className="space-y-3 mt-6 text-sm">

            <div className="grid grid-cols-2 gap-4">
              <InputField type="text" name="firstName" placeholder="First Name" value={address.firstName} onChange={handleChange} />
              <InputField type="text" name="lastName" placeholder="Last Name" value={address.lastName} onChange={handleChange} />
            </div>

            <InputField type="email" name="email" placeholder="Email address" value={address.email} onChange={handleChange} />
            <InputField type="text" name="street" placeholder="Street" value={address.street} onChange={handleChange} />

            <div className="grid grid-cols-2 gap-4">
              <InputField type="text" name="city" placeholder="City" value={address.city} onChange={handleChange} />
              <InputField type="text" name="state" placeholder="State" value={address.state} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField type="text" name="zipCode" placeholder="Zip Code" value={address.zipCode} onChange={handleChange} />
              <InputField type="text" name="country" placeholder="Country" value={address.country} onChange={handleChange} />
            </div>

            <InputField type="text" name="phone" placeholder="Phone number" value={address.phone} onChange={handleChange} />

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-primary hover:bg-primary-dull transition duration-300 cursor-pointer uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Address"}
            </button>
          </form>
        </div>

        <img
          className="md:mr-16 mb-16 md:mt-0"
          src={assets.add_address_iamge}
          alt="Add Address"
        />
      </div>
    </div>
  )
}

export default AddAddress

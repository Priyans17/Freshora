import React, { useState } from 'react'
import { assets } from '../assets/assets'

const AddAddress = () => {

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

  const handleChange = (e) => {
    const { name, value } = e.target

    setAddress(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const InputField = ({ type, placeholder, name }) => (
    <input
      className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition"
      type={type}
      placeholder={placeholder}
      name={name}
      onChange={handleChange}
      value={address[name]}
      required
    />
  )

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    console.log("Saved Address:", address)
    // later: API call or save to context
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
              <InputField type="text" name="firstName" placeholder="First Name" />
              <InputField type="text" name="lastName" placeholder="Last Name" />
            </div>

            <InputField type="email" name="email" placeholder="Email address" />
            <InputField type="text" name="street" placeholder="Street" />

            <div className="grid grid-cols-2 gap-4">
              <InputField type="text" name="city" placeholder="City" />
              <InputField type="text" name="state" placeholder="State" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField type="number" name="zipCode" placeholder="Zip Code" />
              <InputField type="text" name="country" placeholder="Country" />
            </div>

            <InputField type="number" name="phone" placeholder="Phone number" />

            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-primary hover:bg-primary-dull transition duration-300 cursor-pointer uppercase"
            >
              Save Address
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

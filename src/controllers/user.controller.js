import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import Order from "../models/order.model.js";
import Client from "../models/client.model.js";

// GET /api/users/me
export const getCurrentUser = async (req, res) => {
  try {
    const user = await Client.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/users/me
export const updateProfile = async (req, res) => {
  try {
    const { firstname, lastname, email, phone } = req.body;
    const user = await Client.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (email && email !== user.email) {
      const existing = await Client.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    user.firstname = firstname ?? user.firstname;
    user.lastname = lastname ?? user.lastname;
    user.phone = phone ?? user.phone;

    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    return res.status(200).json({ success: true, data: safeUser });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/users/me/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
    }

    const user = await Client.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/users/addresses
export const addAddress = async (req, res) => {
  try {
    const payload = { user: req.user.userId, ...req.body };
    if (payload.isDefault) {
      await Address.updateMany({ user: req.user.userId }, { isDefault: false });
    }
    const addr = new Address(payload);
    await addr.save();
    return res.status(201).json({ success: true, data: addr });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/users/addresses
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/users/addresses/:addressId
export const updateAddress = async (req, res) => {
  try {
    const addr = await Address.findOne({ _id: req.params.addressId, user: req.user.userId });
    if (!addr) return res.status(404).json({ success: false, message: "Address not found" });

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user.userId }, { isDefault: false });
    }

    Object.assign(addr, req.body);
    await addr.save();
    return res.status(200).json({ success: true, data: addr });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE /api/users/addresses/:addressId
export const deleteAddress = async (req, res) => {
  try {
    const addr = await Address.findOneAndDelete({ _id: req.params.addressId, user: req.user.userId });
    if (!addr) return res.status(404).json({ success: false, message: "Address not found" });
    return res.status(200).json({ success: true, message: "Address deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/users/orders
export const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
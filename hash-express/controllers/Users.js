import Users from "../models/usermodel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ['id', 'name', 'email']
        });
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Failed to fetch users" });
    }
};

export const Register = async (req, res) => {
    const { name, email, password, confPassword } = req.body;

    if (password !== confPassword) return res.status(400).json({ msg: "Password and Confirm Password do not match" });

    try {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = await Users.create({
            name,
            email,
            password: hashPassword
        });

        res.status(201).json({ msg: "Registration Successful", user: newUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Registration failed" });
    }
};

export const Login = async (req, res) => {
    try {
        const user = await Users.findOne({ where: { email: req.body.email } });
        if (!user) return res.status(404).json({ msg: "Email not found" });

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: "Wrong Password" });

        const accessToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15s' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        await Users.update({ refresh_token: refreshToken }, { where: { id: user.id } });

        res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Login failed" });
    }
};

export const Logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(204);

    const user = await Users.findOne({ where: { refresh_token: refreshToken } });
    if (!user) return res.sendStatus(204);

    await Users.update({ refresh_token: null }, { where: { id: user.id } });
    res.clearCookie('refreshToken');
    res.sendStatus(200);
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;

    try {
        const user = await Users.findByPk(id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const updates = { name, email };

        if (password) {
            const salt = await bcrypt.genSalt();
            updates.password = await bcrypt.hash(password, salt);
        }

        await user.update(updates);
        res.json({ msg: "User updated successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Failed to update user" });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await Users.findByPk(id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await user.destroy();
        res.json({ msg: "User deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Failed to delete user" });
    }
};

export const addUser = async (req, res) => {
    const { name, email, password, confPassword } = req.body;

    if (password !== confPassword) return res.status(400).json({ msg: "Password and Confirm Password do not match" });

    try {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = await Users.create({
            name,
            email,
            password: hashPassword
        });

        res.status(201).json({ msg: "User added successfully", user: newUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Failed to add user" });
    }
};

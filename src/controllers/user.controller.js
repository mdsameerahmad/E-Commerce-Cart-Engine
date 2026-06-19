import * as userService from "../services/user.service.js";

export const registerUser = async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {
      user,
    },
  });
};

export const getUser = async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

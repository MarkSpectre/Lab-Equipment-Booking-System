import * as authService from "../services/authService.js";

export async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.signup({ name, email, password, role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json({
      token: result.token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

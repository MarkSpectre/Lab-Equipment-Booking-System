import * as authService from "../services/authService.js";
import { subscribeUser } from "../services/snsService.js";

export async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.signup({ name, email, password, role });

    if (result.user.role === "STUDENT") {
      const snsResult = await subscribeUser(email, "STUDENT");
      if (snsResult && !snsResult.success) {
        return res.status(201).json({
          ...result,
          warning: "Account created, but email notification failed",
        });
      }
    }

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

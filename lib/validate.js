// lib/validate.js
export async function validateBody(schema, body) {
  try {
    const validated = await schema.validate(body, { abortEarly: false, stripUnknown: true });
    return validated;
  } catch (err) {
    // create friendly error
    const details = (err.inner || []).map((e) => ({ path: e.path, message: e.message }));
    const error = new Error(err.message || "Validation error");
    error.details = details;
    throw error;
  }
}

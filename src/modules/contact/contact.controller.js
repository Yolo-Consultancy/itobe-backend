import { z } from "zod";
import { Contact } from "./contact.model.js";
import { ApiResponse } from "../../utils/api-response.js";
import { AppError } from "../../utils/api-error.js";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  company_website: z.string().optional(),
});

export class ContactController {
  // Accessible publicly to submit a contact message
  static async createContact(req, res, next) {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError("Vérifiez le nom, l'e-mail, le sujet et le message.", 422);
      }
      if (parsed.data.company_website) {
        return ApiResponse.created(res, null, "Message de contact reçu");
      }
      const contact = await Contact.create({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      return ApiResponse.created(
        res,
        { id: contact._id },
        "Message de contact reçu",
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin view of all contacts
  static async getAllContacts(req, res, next) {
    try {
      const { page = 1, limit = 20, q } = req.query;
      const filter = {};
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { subject: { $regex: q, $options: "i" } },
          { message: { $regex: q, $options: "i" } },
        ];
      }
      const skip = (page - 1) * limit;
      const [contacts, total] = await Promise.all([
        Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        Contact.countDocuments(filter),
      ]);
      return ApiResponse.paginated(res, contacts, {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      }, "Contacts récupérés");
    } catch (error) {
      next(error);
    }
  }
}

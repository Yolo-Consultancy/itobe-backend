import { Contact } from "./contact.model.js";
import { ApiResponse } from "../../utils/api-response.js";

export class ContactController {
  // Accessible publicly to submit a contact message
  static async createContact(req, res, next) {
    try {
      const contact = await Contact.create({
        ...req.body,
      });
      return ApiResponse.created(res, contact, "Message de contact reçu");
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

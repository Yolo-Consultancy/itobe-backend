import { CalendrierService } from "./calendrier.service.js";
import { ApiResponse } from "../../utils/api-response.js";

export class CalendrierController {
  static async getEditorialCalendar(req, res, next) {
    try {
      const { debut, fin, mois } = req.query;
      const result = await CalendrierService.getEditorialElements({ debut, fin, mois });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

import { VisitorEvent } from "./visitor-event.model.js";
import { VisitorPageView } from "./visitor-page-view.model.js";

function dateDuJour(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function periodDays(period) {
  if (period === "30j") return 30;
  if (period === "90j") return 90;
  if (period === "annee") return 365;
  return 7;
}

function startDate(period) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - periodDays(period) + 1);
  return start;
}

function formatLabel(date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

export class VisitorService {
  static async record(visitorId, path = "/") {
    const date = dateDuJour();
    if (!visitorId || typeof visitorId !== "string" || visitorId.length > 120) return;
    if (typeof path !== "string" || path.length > 500 || !path.startsWith("/")) path = "/";

    await Promise.all([
      VisitorPageView.create({ visitorId, path, date }),
      VisitorEvent.updateOne({ visitorId, date }, { $setOnInsert: { visitorId, date } }, { upsert: true }),
    ]);
  }

  static async getStatistics(period = "7j") {
    const days = periodDays(period);
    const start = startDate(period);
    const today = dateDuJour();
    const [total, todayCount, pageViews, uniqueVisitors, daily, topPages] = await Promise.all([
      VisitorEvent.distinct("visitorId").then((ids) => ids.length),
      VisitorEvent.countDocuments({ date: today }),
      VisitorPageView.countDocuments({ createdAt: { $gte: start } }),
      VisitorPageView.distinct("visitorId", { createdAt: { $gte: start } }).then((ids) => ids.length),
      VisitorPageView.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$date", pageViews: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 0, date: "$_id", pageViews: 1, uniqueVisitors: { $size: "$visitors" } } },
        { $sort: { date: 1 } },
      ]),
      VisitorPageView.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$path", visits: { $sum: 1 } } },
        { $project: { _id: 0, path: "$_id", visits: 1 } },
        { $sort: { visits: -1, path: 1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      period,
      total,
      today: todayCount,
      pageViews,
      uniqueVisitors,
      averagePageViews: days ? Math.round(pageViews / days) : 0,
      series: daily.map((item) => ({
        ...item,
        label: formatLabel(new Date(`${item.date}T00:00:00Z`)),
      })),
      topPages,
    };
  }
}

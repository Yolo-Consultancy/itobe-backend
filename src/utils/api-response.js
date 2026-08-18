export class ApiResponse {
  static success(res, data = {}, message = "Opération réussie", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = {}, message = "Création réussie") {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res, data = [], pagination = {}, message = "Données récupérées avec succès") {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        totalPages: pagination.totalPages || 1,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
    });
  }

  static error(res, message = "Une erreur est survenue", statusCode = 500, error = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error || undefined,
    });
  }
}

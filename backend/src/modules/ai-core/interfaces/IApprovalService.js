// IApprovalService Interface definition
class IApprovalService {
  async createRequest(type, targetId, userId) {
    throw new Error("Method createRequest() must be implemented.");
  }
  async approve(requestId, userId) {
    throw new Error("Method approve() must be implemented.");
  }
  async reject(requestId, userId, feedback) {
    throw new Error("Method reject() must be implemented.");
  }
}

module.exports = IApprovalService;

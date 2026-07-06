const { eventBus, Events } = require('./eventBus');
const { notificationsService } = require('../modules/notifications/services/notifications.service');
const prisma = require('../utils/prisma');

eventBus.on(Events.ORDER_PLACED, ({ userId, boutique, order }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_PLACED',
      title: 'Order Placed',
      message: `Your order #${order.orderId || order.id} has been placed successfully.`,
      metadata: { orderId: order.id, boutiqueId: boutique?.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_ORDER',
      title: 'New Order Received',
      message: `New order #${order.orderId || order.id} has been placed.`,
      metadata: { orderId: order.id, customerId: userId }
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_PLACED failed:', err);
  }
});

eventBus.on(Events.PAYMENT_FAILED, ({ userId, boutique, order, error }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Payment for order #${order.orderId || order.id} failed. Please try again.`,
      metadata: { orderId: order.id, error }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Payment failed for order #${order.orderId || order.id}.`,
      metadata: { orderId: order.id, error }
    });
  } catch (err) {
    console.error('[NotificationListener] PAYMENT_FAILED failed:', err);
  }
});

eventBus.on(Events.PAYMENT_SUCCESS, ({ userId, boutique, order }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      message: `Payment for order #${order.orderId || order.id} was successful.`,
      metadata: { orderId: order.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `Payment received for order #${order.orderId || order.id}.`,
      metadata: { orderId: order.id }
    });
  } catch (err) {
    console.error('[NotificationListener] PAYMENT_SUCCESS failed:', err);
  }
});

eventBus.on(Events.ORDER_SHIPPED, ({ userId, user, order, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_SHIPPED',
      title: 'Order Shipped',
      message: `Your order #${order.orderId || order.id} has been shipped!`,
      metadata: { orderId: order.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_SHIPPED failed:', err);
  }
});

eventBus.on(Events.ORDER_DELIVERED, ({ userId, user, order, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered',
      message: `Your order #${order.orderId || order.id} has been delivered.`,
      metadata: { orderId: order.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_DELIVERED failed:', err);
  }
});

eventBus.on(Events.REVIEW_SUBMITTED, ({ review, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_REVIEW',
      title: 'New Review',
      message: `A new review has been submitted for your boutique.`,
      metadata: { reviewId: review.id, boutiqueId: boutique?.id, rating: review.rating }
    });
  } catch (err) {
    console.error('[NotificationListener] REVIEW_SUBMITTED failed:', err);
  }
});

eventBus.on(Events.REVIEW_REPLIED, ({ review, reply }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: review.userId,
      type: 'REVIEW_REPLY',
      title: 'Review Reply',
      message: `The boutique has replied to your review.`,
      metadata: { reviewId: review.id, replyId: reply.id }
    });
  } catch (err) {
    console.error('[NotificationListener] REVIEW_REPLIED failed:', err);
  }
});

eventBus.on(Events.MEASUREMENT_SUBMITTED, ({ measurements, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_MEASUREMENTS',
      title: 'Measurements Submitted',
      message: `New measurements have been submitted for your boutique.`,
      metadata: { measurementsId: measurements.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] MEASUREMENT_SUBMITTED failed:', err);
  }
});

eventBus.on(Events.RETURN_REQUESTED, ({ userId, returnReq, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'RETURN_REQUESTED',
      title: 'Return Requested',
      message: `Your return request has been submitted.`,
      metadata: { returnId: returnReq.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'RETURN_REQUESTED',
      title: 'Return Requested',
      message: `A return request has been submitted for your boutique.`,
      metadata: { returnId: returnReq.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] RETURN_REQUESTED failed:', err);
  }
});

eventBus.on(Events.RETURN_STATUS_CHANGED, ({ customerId, returnReq, newStatus, boutique }) => {
  try {
    const type = newStatus === 'APPROVED' ? 'RETURN_APPROVED' : 'RETURN_REJECTED';
    notificationsService.createCustomerNotification({
      customerId,
      type,
      title: newStatus === 'APPROVED' ? 'Return Approved' : 'Return Rejected',
      message: `Your return request #${returnReq.id} has been ${newStatus.toLowerCase()}.`,
      metadata: { returnId: returnReq.id, status: newStatus }
    });
  } catch (err) {
    console.error('[NotificationListener] RETURN_STATUS_CHANGED failed:', err);
  }
});

eventBus.on(Events.EXCHANGE_REQUESTED, ({ userId, exchange, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'EXCHANGE_REQUESTED',
      title: 'Exchange Requested',
      message: `Your exchange request has been submitted.`,
      metadata: { exchangeId: exchange.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'EXCHANGE_REQUESTED',
      title: 'Exchange Requested',
      message: `An exchange request has been submitted for your boutique.`,
      metadata: { exchangeId: exchange.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] EXCHANGE_REQUESTED failed:', err);
  }
});

eventBus.on(Events.EXCHANGE_STATUS_CHANGED, ({ customerId, exchange, newStatus, boutique }) => {
  try {
    const type = newStatus === 'APPROVED' ? 'EXCHANGE_APPROVED' : 'EXCHANGE_SHIPPED';
    notificationsService.createCustomerNotification({
      customerId,
      type,
      title: newStatus === 'APPROVED' ? 'Exchange Approved' : 'Exchange Shipped',
      message: `Your exchange request #${exchange.id} has been ${newStatus.toLowerCase()}.`,
      metadata: { exchangeId: exchange.id, status: newStatus }
    });
  } catch (err) {
    console.error('[NotificationListener] EXCHANGE_STATUS_CHANGED failed:', err);
  }
});

eventBus.on(Events.BOOKING_CREATED, ({ booking, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_BOOKING',
      title: 'New Booking',
      message: `A new booking has been made for your boutique.`,
      metadata: { bookingId: booking.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] BOOKING_CREATED failed:', err);
  }
});

eventBus.on(Events.BOOKING_CONFIRMED, ({ customerId, booking, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `Your booking has been confirmed.`,
      metadata: { bookingId: booking.id, boutiqueId: boutique?.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `A booking has been confirmed for your boutique.`,
      metadata: { bookingId: booking.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] BOOKING_CONFIRMED failed:', err);
  }
});

eventBus.on(Events.ORDER_CANCELLED, ({ user, order, boutiqueId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: user.id,
      boutiqueId,
      type: 'ORDER_CANCELLED',
      priority: 'HIGH',
      title: 'Order Cancelled',
      message: `Order ${order.orderId || order.id} has been cancelled.`,
      entityType: 'commerce_order',
      entityId: order.orderId || order.id,
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_CANCELLED failed:', err);
  }
});

eventBus.on(Events.BOOKING_REJECTED, ({ booking, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      boutiqueId: booking?.boutiqueId,
      type: 'BOOKING_CANCELLED',
      priority: 'NORMAL',
      title: 'Booking Rejected',
      message: `Booking for ${new Date(booking?.bookingDate).toLocaleDateString()} has been rejected.`,
      entityType: 'booking',
      entityId: booking?.id,
    });
  } catch (err) {
    console.error('[NotificationListener] BOOKING_REJECTED failed:', err);
  }
});

eventBus.on('assignment:created', ({ assignmentId, businessId, templateId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_CREATED',
      title: 'Assignment Created',
      message: `A new business template assignment has been created.`,
      metadata: { assignmentId, businessId, templateId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:created failed:', err);
  }
});

eventBus.on('assignment:validated', ({ assignmentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_VALIDATED',
      title: 'Assignment Validated',
      message: `Business assignment has been validated successfully.`,
      metadata: { assignmentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:validated failed:', err);
  }
});

eventBus.on('assignment:ready', ({ assignmentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_READY',
      title: 'Assignment Ready',
      message: `Business assignment is ready for deployment.`,
      metadata: { assignmentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:ready failed:', err);
  }
});

eventBus.on('assignment:deploying', ({ assignmentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_DEPLOYING',
      title: 'Assignment Deploying',
      message: `Business assignment deployment is in progress.`,
      metadata: { assignmentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:deploying failed:', err);
  }
});

eventBus.on('assignment:deployed', ({ assignmentId, deploymentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_DEPLOYED',
      title: 'Assignment Deployed',
      message: `Business assignment has been deployed successfully.`,
      metadata: { assignmentId, deploymentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:deployed failed:', err);
  }
});

eventBus.on('assignment:active', ({ assignmentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_ACTIVE',
      title: 'Assignment Active',
      message: `Business assignment is now active.`,
      metadata: { assignmentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:active failed:', err);
  }
});

eventBus.on('assignment:failed', ({ assignmentId, businessId, reason }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_FAILED',
      priority: 'HIGH',
      title: 'Assignment Failed',
      message: `Business assignment failed: ${reason || 'Unknown error'}`,
      metadata: { assignmentId, businessId, reason }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:failed failed:', err);
  }
});

eventBus.on('assignment:archived', ({ assignmentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_ARCHIVED',
      title: 'Assignment Archived',
      message: `Business assignment has been archived.`,
      metadata: { assignmentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:archived failed:', err);
  }
});

eventBus.on('assignment:deleted', ({ assignmentId, businessId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: 'system',
      type: 'ASSIGNMENT_DELETED',
      title: 'Assignment Deleted',
      message: `Business assignment has been deleted.`,
      metadata: { assignmentId, businessId }
    });
  } catch (err) {
    console.error('[NotificationListener] assignment:deleted failed:', err);
  }
});

// ── Enterprise Notification Center events (Phase 27) ──

eventBus.on(Events.NOTIFICATION_SENT, ({ notificationId, channel }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Notification Sent', message: `Notification ${notificationId} sent via ${channel}`,
      entityType: 'Notification', entityId: notificationId
    });
  } catch (err) { console.error('[NotificationListener] NOTIFICATION_SENT failed:', err); }
});

eventBus.on(Events.NOTIFICATION_FAILED, ({ notificationId, channel, error }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'HIGH', title: 'Notification Failed', message: `Notification ${notificationId} failed via ${channel}: ${error}`,
      entityType: 'Notification', entityId: notificationId
    });
  } catch (err) { console.error('[NotificationListener] NOTIFICATION_FAILED failed:', err); }
});

eventBus.on(Events.NOTIFICATION_DELIVERED, ({ notificationId, channel }) => {
  try {
    prisma.notificationReceipt.updateMany({
      where: { notificationId },
      data: { deliveredAt: new Date() }
    }).catch(() => {});
  } catch (err) { console.error('[NotificationListener] NOTIFICATION_DELIVERED failed:', err); }
});

eventBus.on(Events.NOTIFICATION_READ, ({ notificationId, userId }) => {
  try {
    prisma.$transaction([
      prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } }).catch(() => {}),
      prisma.notificationReceipt.updateMany({
        where: { notificationId, OR: [{ recipientOwnerId: userId }, { recipientUserId: userId }] },
        data: { openedAt: new Date(), clickedAt: new Date() }
      }).catch(() => {})
    ]);
  } catch (err) { console.error('[NotificationListener] NOTIFICATION_READ failed:', err); }
});

eventBus.on(Events.NOTIFICATION_CAMPAIGN_STARTED, ({ campaignId, name }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Campaign Started', message: `Campaign "${name}" has been launched.`,
      entityType: 'Campaign', entityId: campaignId
    });
  } catch (err) { console.error('[NotificationListener] NOTIFICATION_CAMPAIGN_STARTED failed:', err); }
});

eventBus.on(Events.NOTIFICATION_CAMPAIGN_COMPLETED, ({ campaignId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Campaign Completed', message: `Campaign ${campaignId} has completed.`,
      entityType: 'Campaign', entityId: campaignId
    });
  } catch (err) { console.error('[NotificationListener] NOTIFICATION_CAMPAIGN_COMPLETED failed:', err); }
});

// ── Enterprise DevOps / CI-CD Center events (Phase 28) ──

eventBus.on(Events.DEVOPS_PIPELINE_STARTED, ({ pipelineId, definitionId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Pipeline Started', message: `Pipeline ${pipelineId} (definition: ${definitionId}) has started.`,
      entityType: 'WorkflowExecution', entityId: pipelineId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_PIPELINE_STARTED failed:', err); }
});

eventBus.on(Events.DEVOPS_PIPELINE_COMPLETED, ({ pipelineId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Pipeline Completed', message: `Pipeline ${pipelineId} completed successfully.`,
      entityType: 'WorkflowExecution', entityId: pipelineId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_PIPELINE_COMPLETED failed:', err); }
});

eventBus.on(Events.DEVOPS_PIPELINE_FAILED, ({ pipelineId, reason }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'HIGH', title: 'Pipeline Failed', message: `Pipeline ${pipelineId} failed: ${reason || 'Unknown error'}.`,
      entityType: 'WorkflowExecution', entityId: pipelineId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_PIPELINE_FAILED failed:', err); }
});

eventBus.on(Events.DEVOPS_BUILD_STARTED, ({ deploymentId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Build Started', message: `Build started for deployment ${deploymentId}.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_BUILD_STARTED failed:', err); }
});

eventBus.on(Events.DEVOPS_BUILD_COMPLETED, ({ deploymentId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Build Completed', message: `Build completed for deployment ${deploymentId}.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_BUILD_COMPLETED failed:', err); }
});

eventBus.on(Events.DEVOPS_BUILD_FAILED, ({ deploymentId, error }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'HIGH', title: 'Build Failed', message: `Build failed for deployment ${deploymentId}: ${error || 'Unknown error'}.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_BUILD_FAILED failed:', err); }
});

eventBus.on(Events.DEVOPS_DEPLOYMENT_STARTED, ({ deploymentId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Deployment Started', message: `Deployment ${deploymentId} has started.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_DEPLOYMENT_STARTED failed:', err); }
});

eventBus.on(Events.DEVOPS_DEPLOYMENT_COMPLETED, ({ deploymentId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Deployment Completed', message: `Deployment ${deploymentId} completed successfully.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_DEPLOYMENT_COMPLETED failed:', err); }
});

eventBus.on(Events.DEVOPS_DEPLOYMENT_FAILED, ({ deploymentId, error }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'HIGH', title: 'Deployment Failed', message: `Deployment ${deploymentId} failed: ${error || 'Unknown error'}.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_DEPLOYMENT_FAILED failed:', err); }
});

eventBus.on(Events.DEVOPS_RELEASE_CREATED, ({ releaseId, boutiqueId, releaseTag }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Release Created', message: `Release ${releaseTag} (${releaseId}) created for boutique ${boutiqueId}.`,
      entityType: 'ImmutableRelease', entityId: releaseId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_RELEASE_CREATED failed:', err); }
});

eventBus.on(Events.DEVOPS_RELEASE_APPROVED, ({ releaseId, boutiqueId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'NORMAL', title: 'Release Approved', message: `Release ${releaseId} approved for boutique ${boutiqueId}.`,
      entityType: 'ImmutableRelease', entityId: releaseId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_RELEASE_APPROVED failed:', err); }
});

eventBus.on(Events.DEVOPS_RELEASE_ROLLED_BACK, ({ deploymentId, userId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN', recipientId: 'system', type: 'SYSTEM_ALERT',
      priority: 'HIGH', title: 'Release Rolled Back', message: `Deployment ${deploymentId} rolled back by user ${userId}.`,
      entityType: 'Deployment', entityId: deploymentId
    });
  } catch (err) { console.error('[NotificationListener] DEVOPS_RELEASE_ROLLED_BACK failed:', err); }
});

eventBus.on(Events.LOW_STOCK, ({ boutique, variant, product }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      boutiqueId: product?.boutiqueId,
      type: 'LOW_STOCK',
      priority: 'HIGH',
      title: 'Low Stock Alert',
      message: `"${product?.name}" (${variant?.sku || 'variant'}) is running low: ${variant?.inventory?.quantity || 0} left.`,
      entityType: 'product_variant',
      entityId: variant?.id,
    });
  } catch (err) {
    console.error('[NotificationListener] LOW_STOCK failed:', err);
  }
});

module.exports = { eventBus, Events };

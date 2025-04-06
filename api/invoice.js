import request from '@/utils/requestUtil'

/**
 * 申请发票
 * @param {Object} data - 发票申请数据
 */
export function applyInvoice(data) {
    return request({
        url: '/order/invoice/apply',
        method: 'post',
        data: data
    });
}

/**
 * 获取发票列表
 * @param {Object} params - 查询参数
 */
export function fetchInvoiceList(params) {
    return request({
        url: '/order/invoice/list',
        method: 'get',
        params: params
    });
}

/**
 * 获取发票详情
 * @param {number} id - 发票ID
 */
export function fetchInvoiceDetail(id) {
    return request({
        url: `/order/invoice/detail/${id}`,
        method: 'get'
    });
}

/**
 * 通过订单ID获取发票
 * @param {number} orderId - 订单ID
 */
export function fetchInvoiceByOrderId(orderId) {
    return request({
        url: `/order/invoice/getByOrderId/${orderId}`,
        method: 'get'
    });
}

/**
 * 检查订单是否已申请过发票
 * @param {number} orderId - 订单ID
 */
export function checkOrderInvoice(orderId) {
    return request({
        url: `/order/invoice/check/${orderId}`,
        method: 'get'
    });
} 
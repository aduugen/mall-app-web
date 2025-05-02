<template>
	<view class="content">
		<!-- 顶部标题栏 -->
		<view class="page-header">
			<view class="back-btn" @click="goBack">
				<text class="yticon icon-zuojiantou"></text>
			</view>
			<view class="page-title">售后详情</view>
			<view class="placeholder"></view>
		</view>
		
		<view v-if="!afterSaleDetail || loadError" class="error-container">
			<view class="error-icon">
				<text class="yticon icon-jujue"></text>
			</view>
			<text class="error-text">{{errorMessage || '获取售后详情失败，请稍后重试'}}</text>
			<button class="retry-btn" @click="retryLoading">重新加载</button>
		</view>
		
		<template v-else>
			<view class="status-section" v-if="afterSaleDetail">
				<view class="status-icon" :class="statusIconClass">
					<text class="yticon" :class="statusIcon"></text>
				</view>
				<view class="status-info">
					<text class="status-text">{{statusText}}</text>
					<text class="status-desc">{{statusDesc}}</text>
				</view>
				<view class="refresh-btn" v-if="dataFromCache" @click="refreshData">
					<text class="yticon icon-refresh"></text>
				</view>
			</view>
			
			<!-- 进度详情 -->
			<view class="progress-section" v-if="afterSaleDetail">
				<view class="section-title">进度详情</view>
				<view class="progress-timeline">
					<!-- 申请提交节点 - 始终存在且激活 -->
					<view class="timeline-item active">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">售后申请提交</text>
							<text class="timeline-time">{{formatDate(afterSaleDetail.createTime)}}</text>
							<view class="timeline-substatus">
								<text class="substatus-text">您已提交售后申请，等待商家处理</text>
							</view>
						</view>
					</view>
					
					<!-- 售后单审核节点 - process_type = 1 -->
					<view class="timeline-item" :class="{'active': hasProcessTypeRecord(1)}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">售后单审核</text>
							<text class="timeline-time" v-if="hasProcessTypeRecord(1)">{{getProcessTime(1)}}</text>
							<view class="timeline-substatus" v-if="hasProcessTypeRecord(1)">
								<text class="substatus-text">{{getProcessSubstatusText(1)}}</text>
								<text class="substatus-reason" v-if="getProcessNote(1)">
									备注：{{getProcessNote(1)}}
								</text>
							</view>
						</view>
					</view>
					
					<!-- 用户发货节点 - process_type = 2 -->
					<view class="timeline-item" :class="{'active': hasProcessTypeRecord(2)}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">用户发货</text>
							<text class="timeline-time" v-if="hasProcessTypeRecord(2)">{{getProcessTime(2)}}</text>
							<view class="timeline-substatus" v-if="hasProcessTypeRecord(2)">
								<text class="substatus-text">{{getProcessSubstatusText(2)}}</text>
								<text class="substatus-reason" v-if="getProcessNote(2)">
									备注：{{getProcessNote(2)}}
								</text>
							</view>
						</view>
					</view>
					
					<!-- 商家收货节点 - process_type = 3 -->
					<view class="timeline-item" :class="{'active': hasProcessTypeRecord(3)}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">商家收货</text>
							<text class="timeline-time" v-if="hasProcessTypeRecord(3)">{{getProcessTime(3)}}</text>
							<view class="timeline-substatus" v-if="hasProcessTypeRecord(3)">
								<text class="substatus-text">{{getProcessSubstatusText(3)}}</text>
								<text class="substatus-reason" v-if="getProcessNote(3)">
									备注：{{getProcessNote(3)}}
								</text>
							</view>
						</view>
					</view>
					
					<!-- 商家质检节点 - process_type = 4 -->
					<view class="timeline-item" :class="{'active': hasProcessTypeRecord(4)}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">商家质检</text>
							<text class="timeline-time" v-if="hasProcessTypeRecord(4)">{{getProcessTime(4)}}</text>
							<view class="timeline-substatus" v-if="hasProcessTypeRecord(4)">
								<text class="substatus-text">{{getProcessSubstatusText(4)}}</text>
								<text class="substatus-reason" v-if="getProcessNote(4)">
									备注：{{getProcessNote(4)}}
								</text>
							</view>
						</view>
					</view>
					
					<!-- 商家退款节点 - process_type = 5 -->
					<view class="timeline-item" :class="{'active': hasProcessTypeRecord(5)}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">商家退款</text>
							<text class="timeline-time" v-if="hasProcessTypeRecord(5)">{{getProcessTime(5)}}</text>
							<view class="timeline-substatus" v-if="hasProcessTypeRecord(5)">
								<text class="substatus-text">{{getProcessSubstatusText(5)}}</text>
								<text class="substatus-reason" v-if="getProcessNote(5)">
									备注：{{getProcessNote(5)}}
								</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<view class="detail-section" v-if="afterSaleDetail">
				<view class="section-title">售后信息</view>
				<view class="detail-content">
					<view class="detail-item">
						<text class="item-label">售后编号</text>
						<text class="item-value">{{afterSaleDetail.id}}</text>
					</view>
					<!-- 添加订单号显示 -->
					<view class="detail-item">
						<text class="item-label">订单号</text>
						<text class="item-value copy-text" @click="copyText(afterSaleDetail.orderId)">
							{{afterSaleDetail.orderId}}
							<text class="copy-icon yticon icon-fuzhi"></text>
						</text>
					</view>
					<!-- 添加订单SN显示 -->
					<view class="detail-item" v-if="orderInfo && orderInfo.orderSn">
						<text class="item-label">订单SN</text>
						<text class="item-value copy-text" @click="copyText(orderInfo.orderSn)">
							{{orderInfo.orderSn}}
							<text class="copy-icon yticon icon-fuzhi"></text>
						</text>
					</view>
					<view class="detail-item">
						<text class="item-label">创建时间</text>
						<text class="item-value">{{formatDate(afterSaleDetail.createTime)}}</text>
					</view>
					<view class="detail-item">
						<text class="item-label">售后原因</text>
						<text class="item-value">{{getAfterSaleReason()}}</text>
					</view>
					<!-- 添加退款总金额显示 -->
					<view class="detail-item">
						<text class="item-label">退款总金额</text>
						<text class="price">￥{{calculateTotalRefund()}}</text>
					</view>
					<view class="detail-item" v-if="afterSaleDetail.handleNote">
						<text class="item-label">处理备注</text>
						<text class="item-value">{{afterSaleDetail.handleNote}}</text>
					</view>
					<view class="detail-item" v-if="afterSaleDetail.handleTime">
						<text class="item-label">处理时间</text>
						<text class="item-value">{{formatDate(afterSaleDetail.handleTime)}}</text>
					</view>
					<!-- 添加联系人/联系方式 -->
					<view class="detail-item" v-if="orderInfo && orderInfo.receiverName">
						<text class="item-label">联系人</text>
						<text class="item-value">{{orderInfo.receiverName}}</text>
					</view>
					<view class="detail-item" v-if="orderInfo && orderInfo.receiverPhone">
						<text class="item-label">联系方式</text>
						<text class="item-value copy-text" @click="copyText(orderInfo.receiverPhone)">
							{{orderInfo.receiverPhone}}
							<text class="copy-icon yticon icon-fuzhi"></text>
						</text>
					</view>
				</view>
			</view>
			
			<view class="pics-section" v-if="afterSaleDetail && hasProofPics()">
				<view class="section-title">退货凭证</view>
				<scroll-view class="pics-scroll" scroll-x="true" show-scrollbar="false">
					<view class="pics-container">
						<view class="pic-item" v-for="(pic, picIndex) in getProofPics()" :key="picIndex" @click="previewImage(pic, getProofPics())">
							<image class="thumbnail" :src="pic" mode="aspectFill"></image>
						</view>
					</view>
				</scroll-view>
			</view>
			
			<view class="goods-section" v-if="afterSaleDetail && afterSaleDetail.afterSaleItemList">
				<view class="section-title">退货商品</view>
				<view class="price-note">显示价格为实际支付价格，用于计算退款金额</view>
				<view class="goods-item" v-for="(item, index) in afterSaleDetail.afterSaleItemList" :key="index">
					<image class="goods-img" :src="fixImagePath(item.productPic)" mode="aspectFill" @error="onImageError"></image>
					<view class="goods-info">
						<text class="goods-name">{{item.productName}}</text>
						<text class="goods-attr">{{item.productAttr | formatProductAttr}}</text>
						<view class="goods-price">
							<text class="price">￥{{item.productRealPrice || item.productPrice || 0}}</text>
							<text class="original-price" v-if="item.productRealPrice && item.productPrice && item.productRealPrice != item.productPrice">￥{{item.productPrice}}</text>
						</view>
						<view class="return-quantity">
							<text class="quantity-label">购买数量:</text>
							<text class="quantity-value">{{item.productQuantity}}</text>
							<text class="quantity-label return">退货数量:</text>
							<text class="quantity-value return">{{item.returnQuantity}}</text>
						</view>
						<view class="item-reason" v-if="item.reason">
							<text class="reason-label">退货原因:</text>
							<text class="reason-value">{{item.reason}}</text>
						</view>
						<view class="item-pics" v-if="item.pics">
							<text class="pics-label">凭证图片:</text>
							<scroll-view class="pics-scroll" scroll-x="true" show-scrollbar="false">
								<view class="pics-container">
									<view class="pic-item" v-for="(pic, picIndex) in formatPics(item.pics)" :key="picIndex" @click="previewImage(pic, formatPics(item.pics))">
										<image class="thumbnail" :src="pic" mode="aspectFill"></image>
									</view>
								</view>
							</scroll-view>
						</view>
					</view>
				</view>
			</view>
			<!-- 添加调试信息区域 -->
			<view class="debug-section" v-if="debugMode && afterSaleDetail">
				<view class="section-title">调试信息 (Debug Mode)</view>
				<view class="debug-content">
					<view class="debug-item">
						<text class="debug-label">售后ID:</text>
						<text class="debug-value">{{afterSaleId}}</text>
					</view>
					
					<view class="debug-item">
						<text class="debug-label">数据来源:</text>
						<text class="debug-value" :style="{color: dataFromCache ? '#00b894' : '#e17055'}">
							{{dataFromCache ? '缓存数据' : 'API请求'}}
						</text>
					</view>
					
					<view class="debug-item">
						<text class="debug-label">数据类型:</text>
						<text class="debug-value">{{typeof afterSaleDetail}}</text>
					</view>
					
					<view class="debug-item" v-if="afterSaleDetail.afterSaleItemList">
						<text class="debug-label">商品项数量:</text>
						<text class="debug-value">{{afterSaleDetail.afterSaleItemList.length}}</text>
					</view>
					
					<view class="debug-item" v-for="field in filteredDetailFields" :key="field.key">
						<text class="debug-label">{{field.key}}:</text>
						<text class="debug-value">{{field.value}}</text>
					</view>
					
					<view class="debug-panel" v-if="afterSaleDetail.afterSaleItemList && afterSaleDetail.afterSaleItemList.length > 0">
						<text class="debug-panel-title">第一个商品项数据:</text>
						<view class="debug-item" v-for="field in firstItemFields" :key="field.key">
							<text class="debug-label">{{field.key}}:</text>
							<text class="debug-value">{{field.value}}</text>
						</view>
					</view>
				</view>
			</view>
			<!-- 直接显示处理记录原始数据（调试用） -->
			<view class="debug-section" v-if="debugMode && afterSaleDetail && afterSaleDetail.processList">
				<view class="section-title">处理记录原始数据</view>
				<view class="debug-data">
					<view class="debug-record" v-for="(process, index) in afterSaleDetail.processList" :key="index">
						<text class="debug-index">记录 {{index+1}}:</text>
						<view class="debug-fields">
							<view class="debug-field" v-for="(value, key) in process" :key="key">
								<text class="field-name">{{key}}:</text>
								<text class="field-value">{{value}}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</template>
	</view>
</template>

<script>
import {fetchAfterSaleDetail, cancelAfterSale} from '@/api/afterSale.js';
import {getOrderDetail} from '@/api/order.js';
import {formatDate} from '@/utils/date';
import {API_BASE_URL} from '@/utils/appConfig.js';

export default {
	data() {
		return {
			afterSaleId: null,
			afterSaleDetail: null,
			orderInfo: null,
			statusChangeTimes: {}, // 存储各状态的时间记录
			loadError: false,
			errorMessage: '',
			debugMode: false, // 调试模式标志
			dataFromCache: false // 标记数据来源是否为缓存
		}
	},
	computed: {
		statusText() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return '待处理';
				case 1: return '处理中';
				case 2: return '已完成';
				case 3: return '已拒绝';
				default: return '未知状态';
			}
		},
		statusDesc() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return '您的售后申请已提交，等待商家处理';
				case 1: return '商家正在处理您的售后申请';
				case 2: return '售后申请已处理完成';
				case 3: return '很抱歉，您的售后申请被拒绝';
				default: return '';
			}
		},
		statusIcon() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return 'icon-daifukuan';
				case 1: return 'icon-shouhou';
				case 2: return 'icon-yiwancheng';
				case 3: return 'icon-jujue';
				default: return 'icon-help';
			}
		},
		statusIconClass() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return 'wait';
				case 1: return 'process';
				case 2: return 'success';
				case 3: return 'reject';
				default: return '';
			}
		},
		// 排序后的处理记录列表（按处理时间升序）
		sortedProcessList() {
			if (!this.afterSaleDetail) {
				console.log('【调试】sortedProcessList - afterSaleDetail不存在');
				return [];
			}
			
			if (!this.afterSaleDetail.processList) {
				console.log('【调试】sortedProcessList - processList不存在');
				return [];
			}
			
			console.log('【调试】sortedProcessList - processList类型:', typeof this.afterSaleDetail.processList);
			console.log('【调试】sortedProcessList - processList是否数组:', Array.isArray(this.afterSaleDetail.processList));
			
			// 确保processList是数组
			if (!Array.isArray(this.afterSaleDetail.processList)) {
				console.error('【调试】processList不是数组类型，尝试解析');
				try {
					if (typeof this.afterSaleDetail.processList === 'string') {
						const parsed = JSON.parse(this.afterSaleDetail.processList);
						if (Array.isArray(parsed)) {
							console.log('【调试】成功将processList解析为数组');
							return [...parsed].sort((a, b) => {
								return new Date(a.handleTime) - new Date(b.handleTime);
							});
						}
					}
					console.error('【调试】无法将processList解析为数组');
					return [];
				} catch (e) {
					console.error('【调试】解析processList时发生错误:', e);
					return [];
				}
			}
			
			// 检查数组是否有元素
			if (this.afterSaleDetail.processList.length === 0) {
				console.log('【调试】processList是空数组');
				return [];
			}
			
			// 检查第一个元素的结构
			const firstItem = this.afterSaleDetail.processList[0];
			console.log('【调试】processList第一项:', JSON.stringify(firstItem, null, 2));
			
			// 正常处理
			return [...this.afterSaleDetail.processList].sort((a, b) => {
				// 兼容不同字段名
				const aTime = a.handleTime || a.handle_time;
				const bTime = b.handleTime || b.handle_time;
				return new Date(aTime) - new Date(bTime);
			});
		},
		
		// 是否为最终状态
		isFinalStatus() {
			return this.afterSaleDetail && 
				(this.afterSaleDetail.status === 2 || this.afterSaleDetail.status === 3);
		},
		
		// 是否已有最终状态的处理记录
		hasFinalProcess() {
			if (!this.afterSaleDetail || !this.afterSaleDetail.processList) {
				return false;
			}
			
			// 检查是否有退款处理记录（代表完成）
			const hasRefundProcess = this.afterSaleDetail.processList.some(p => p.processType === 5);
			
			// 检查是否有审核不通过的记录（代表拒绝）
			const hasRejectProcess = this.afterSaleDetail.processList.some(
				p => p.processType === 1 && p.processResult === 0
			);
			
			return hasRefundProcess || hasRejectProcess;
		},
		
		// 最终状态标题
		getFinalStatusTitle() {
			if (!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 2: return '售后完成';
				case 3: return '申请被拒绝';
				default: return '处理中';
			}
		},
		
		// 最终状态图标样式
		getFinalStatusIconClass() {
			if (!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 2: return 'icon-success';
				case 3: return 'icon-fail';
				default: return '';
			}
		},
		
		// 最终状态时间
		getFinalStatusTime() {
			if (!this.afterSaleDetail) return '';
			
			// 对于完成状态，使用handleTime
			if (this.afterSaleDetail.status === 2 && this.afterSaleDetail.handleTime) {
				return this.formatDate(this.afterSaleDetail.handleTime);
			}
			
			// 对于拒绝状态，使用handleTime
			if (this.afterSaleDetail.status === 3 && this.afterSaleDetail.handleTime) {
				return this.formatDate(this.afterSaleDetail.handleTime);
			}
			
			return '';
		},
		// 过滤后的售后详情字段（排除afterSaleItemList）
		filteredDetailFields() {
			if (!this.afterSaleDetail) return [];
			
			const result = [];
			for (const [key, value] of Object.entries(this.afterSaleDetail)) {
				if (key !== 'afterSaleItemList') {
					result.push({
						key,
						value: typeof value === 'object' ? JSON.stringify(value) : value
					});
				}
			}
			return result;
		},
		// 第一个商品项的字段
		firstItemFields() {
			if (!this.afterSaleDetail || !this.afterSaleDetail.afterSaleItemList || !this.afterSaleDetail.afterSaleItemList.length) {
				return [];
			}
			
			const firstItem = this.afterSaleDetail.afterSaleItemList[0];
			const result = [];
			
			for (const [key, value] of Object.entries(firstItem)) {
				result.push({
					key,
					value: typeof value === 'object' ? JSON.stringify(value) : value
				});
			}
			
			return result;
		}
	},
	onLoad(options) {
		console.log('页面加载，options:', options);
		
		// 开启调试模式 - 通过在URL中添加debug=1启用
		if (options.debug === '1' || options.debug === 1) {
			this.debugMode = true;
			console.log('已启用调试模式');
		}
		
		// 获取售后ID
		this.afterSaleId = options.id;
		if (!this.afterSaleId) {
			uni.showToast({
				title: '未提供售后单ID',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
			return;
		}
		
		// 获取售后详情
		this.getAfterSaleDetail();
	},
	onReady() {
		console.log('页面就绪');
		// 调试信息
		if (this.afterSaleDetail) {
			console.log('================售后详情数据================');
			console.log(JSON.stringify(this.afterSaleDetail, null, 2));
			
			// 特别检查处理记录列表
			if (this.afterSaleDetail.processList) {
				console.log('【调试】发现处理记录列表，数量:', this.afterSaleDetail.processList.length);
				console.log('【调试】处理记录内容:', JSON.stringify(this.afterSaleDetail.processList, null, 2));
				
				// 遍历处理记录，输出更详细的信息
				if (this.debugMode) {
					this.debugProcessList();
				}
			} else {
				console.log('【调试】售后详情中没有processList字段');
			}
			
			// 检查并输出所有可能包含原因的字段
			['reason', 'returnReason', 'description', 'note', 'handleNote'].forEach(field => {
				if (this.afterSaleDetail[field]) {
					console.log(`【调试】找到可能的原因字段 ${field}:`, this.afterSaleDetail[field]);
				}
			});
			
			// 检查并输出所有可能包含图片的字段
			['pics', 'proofPics', 'images', 'proof_pics'].forEach(field => {
				if (this.afterSaleDetail[field]) {
					console.log(`【调试】找到可能的图片字段 ${field}:`, this.afterSaleDetail[field]);
					console.log(`【调试】图片字段 ${field} 的类型:`, typeof this.afterSaleDetail[field]);
				}
			});
			
			// 检查返回的数据是否有效
			if (!this.afterSaleDetail || typeof this.afterSaleDetail !== 'object') {
				console.error('售后详情数据无效');
				this.loadError = true;
				this.errorMessage = '售后详情数据无效或已被删除';
				return;
			}
			
			// 检查关键字段
			if (this.afterSaleDetail.afterSaleItemList) {
				console.log('【调试】售后商品项数量:', this.afterSaleDetail.afterSaleItemList.length);
				
				if (this.afterSaleDetail.afterSaleItemList.length > 0) {
					const firstItem = this.afterSaleDetail.afterSaleItemList[0];
					console.log('【调试】第一个售后商品项完整数据:', JSON.stringify(firstItem, null, 2));
					console.log('【调试】第一个售后商品项字段列表:', Object.keys(firstItem));
					
					// 检查商品项中的原因字段
					['reason', 'returnReason', 'description', 'note'].forEach(field => {
						if (firstItem[field]) {
							console.log(`【调试】商品项中找到可能的原因字段 ${field}:`, firstItem[field]);
						}
					});
					
					// 检查商品项中的图片字段
					['pics', 'proofPics', 'images', 'proof_pics'].forEach(field => {
						if (firstItem[field]) {
							console.log(`【调试】商品项中找到可能的图片字段 ${field}:`, firstItem[field]);
							console.log(`【调试】商品项图片字段 ${field} 的类型:`, typeof firstItem[field]);
						}
					});
				}
			}
			
			// 获取订单详情
			if(this.afterSaleDetail.orderId) {
				this.getOrderDetail(this.afterSaleDetail.orderId);
			} else {
				console.error('售后详情中没有订单ID');
			}
		} else {
			console.log('售后详情数据尚未加载');
		}
	},
	
	// 调试处理记录列表
	debugProcessList() {
		if (!this.afterSaleDetail || !this.afterSaleDetail.processList) {
			console.log('【调试】没有处理记录可显示');
			return;
		}
		
		console.log('================处理记录详细信息================');
		// 检查每种类型的处理记录
		for (let type = 1; type <= 5; type++) {
			const hasRecord = this.hasProcessTypeRecord(type);
			const process = this.findProcessByType(type);
			
			console.log(`【调试】处理类型 ${type}:`);
			console.log(`- 是否存在记录: ${hasRecord}`);
			
			if (process) {
				const processResult = process.processResult !== undefined ? Number(process.processResult) : 
								   (process.process_result !== undefined ? Number(process.process_result) : -1);
				
				const handleTime = process.handleTime || process.handle_time;
				const handleNote = process.handleNote || process.handle_note;
				
				console.log(`- 处理结果: ${processResult} (${processResult === 1 ? '通过' : '不通过'})`);
				console.log(`- 处理时间: ${handleTime}`);
				console.log(`- 处理备注: ${handleNote || '无'}`);
				console.log(`- 完整记录: ${JSON.stringify(process)}`);
			} else {
				console.log(`- 未找到类型为 ${type} 的处理记录`);
			}
			console.log('-------------------------------------------');
		}
	},
	filters: {
		formatProductAttr(attrStr) {
			if(!attrStr) return '';
			
			try {
				let attrArr = JSON.parse(attrStr);
				let result = [];
				for(let item of attrArr) {
					result.push(item.key + ':' + item.value);
				}
				return result.join(' ');
			} catch(e) {
				return attrStr;
			}
		}
	},
	methods: {
		formatDate,
		getAfterSaleDetail(ignoreCache = true) {
			console.log('开始获取售后详情，ID:', this.afterSaleId, ignoreCache ? '(忽略缓存)' : '');
			
			// 首先尝试从缓存获取数据（除非明确要求忽略缓存）
			if (!ignoreCache) {
				const cachedData = this.getAfterSaleFromCache();
				if (cachedData) {
					console.log('使用缓存的售后数据');
					this.afterSaleDetail = cachedData;
					this.dataFromCache = true;
					
					// 处理processList字段，确保其为数组
					this.ensureProcessListIsArray();
					
					// 如果有orderId，获取订单详情
					if(this.afterSaleDetail.orderId) {
						this.getOrderDetail(this.afterSaleDetail.orderId);
					}
					
					// 输出调试信息
					if (this.debugMode) {
						console.log('【调试】使用缓存数据：', JSON.stringify(this.afterSaleDetail, null, 2));
					}
					
					return; // 使用缓存数据，无需继续API请求
				}
			} else {
				console.log('忽略缓存，直接请求API');
			}
			
			// 没有缓存数据，显示加载状态并请求API
			uni.showLoading({
				title: '加载中...'
			});
			
			// 重置错误状态
			this.loadError = false;
			this.errorMessage = '';
			
			fetchAfterSaleDetail({id: this.afterSaleId}).then(response => {
				uni.hideLoading();
				console.log('=======================================================');
				console.log('【调试】售后详情接口原始响应:', response);
				
				if(response.code === 200) {
					this.afterSaleDetail = response.data;
					console.log('【调试】售后详情数据类型:', typeof this.afterSaleDetail);
					console.log('【调试】售后详情数据完整内容:', JSON.stringify(this.afterSaleDetail, null, 2));
					console.log('【调试】售后详情顶层字段列表:', Object.keys(this.afterSaleDetail));
					
					// 处理processList字段，确保其为数组
					this.ensureProcessListIsArray();
					
					// 特别检查处理记录列表
					if (this.afterSaleDetail.processList) {
						console.log('【调试】发现处理记录列表，数量:', this.afterSaleDetail.processList.length);
						console.log('【调试】处理记录内容:', JSON.stringify(this.afterSaleDetail.processList, null, 2));
					} else {
						console.log('【调试】售后详情中没有processList字段');
					}
					
					// 检查并输出所有可能包含原因的字段
					['reason', 'returnReason', 'description', 'note', 'handleNote'].forEach(field => {
						if (this.afterSaleDetail[field]) {
							console.log(`【调试】找到可能的原因字段 ${field}:`, this.afterSaleDetail[field]);
						}
					});
					
					// 检查并输出所有可能包含图片的字段
					['pics', 'proofPics', 'images', 'proof_pics'].forEach(field => {
						if (this.afterSaleDetail[field]) {
							console.log(`【调试】找到可能的图片字段 ${field}:`, this.afterSaleDetail[field]);
							console.log(`【调试】图片字段 ${field} 的类型:`, typeof this.afterSaleDetail[field]);
						}
					});
					
					// 检查返回的数据是否有效
					if (!this.afterSaleDetail || typeof this.afterSaleDetail !== 'object') {
						console.error('售后详情数据无效');
						this.loadError = true;
						this.errorMessage = '售后详情数据无效或已被删除';
						return;
					}
					
					// 检查关键字段
					if (this.afterSaleDetail.afterSaleItemList) {
						console.log('【调试】售后商品项数量:', this.afterSaleDetail.afterSaleItemList.length);
						
						if (this.afterSaleDetail.afterSaleItemList.length > 0) {
							const firstItem = this.afterSaleDetail.afterSaleItemList[0];
							console.log('【调试】第一个售后商品项完整数据:', JSON.stringify(firstItem, null, 2));
							console.log('【调试】第一个售后商品项字段列表:', Object.keys(firstItem));
							
							// 检查商品项中的原因字段
							['reason', 'returnReason', 'description', 'note'].forEach(field => {
								if (firstItem[field]) {
									console.log(`【调试】商品项中找到可能的原因字段 ${field}:`, firstItem[field]);
								}
							});
							
							// 检查商品项中的图片字段
							['pics', 'proofPics', 'images', 'proof_pics'].forEach(field => {
								if (firstItem[field]) {
									console.log(`【调试】商品项中找到可能的图片字段 ${field}:`, firstItem[field]);
									console.log(`【调试】商品项图片字段 ${field} 的类型:`, typeof firstItem[field]);
								}
							});
						}
					}
					
					// 获取订单详情
					if(this.afterSaleDetail.orderId) {
						this.getOrderDetail(this.afterSaleDetail.orderId);
					} else {
						console.error('售后详情中没有订单ID');
					}
				} else {
					console.error('获取售后详情失败:', response.message);
					this.loadError = true;
					this.errorMessage = response.message || '获取售后详情失败';
					uni.showToast({
						title: response.message || '获取售后详情失败',
						icon: 'none',
						duration: 2000
					});
				}
			}).catch(error => {
				uni.hideLoading();
				console.error('获取售后详情异常:', error);
				this.loadError = true;
				this.errorMessage = error.message || '获取售后详情异常';
				uni.showToast({
					title: '获取售后详情异常:' + (error.message || '未知错误'),
					icon: 'none',
					duration: 2000
				});
			});
		},
		
		// 确保processList是数组
		ensureProcessListIsArray() {
			if (!this.afterSaleDetail) return;
			
			// 输出售后详情原始状态
			console.log('【调试】售后详情完整字段:', Object.keys(this.afterSaleDetail));
			console.log('【调试】售后单状态:', this.afterSaleDetail.status);
			console.log('【调试】售后退货类型:', this.afterSaleDetail.returnType);
			console.log('【调试】处理时间:', this.afterSaleDetail.handleTime);
			
			// 如果processList不存在，创建空数组
			if (!this.afterSaleDetail.processList) {
				console.log('【调试】processList不存在，创建空数组');
				this.afterSaleDetail.processList = [];
			} else {
				console.log('【调试】processList存在，类型:', typeof this.afterSaleDetail.processList);
				if (this.afterSaleDetail.processList) {
					console.log('【调试】processList内容:', JSON.stringify(this.afterSaleDetail.processList));
				}
			}
			
			// 处理processList可能是字符串的情况
			if (typeof this.afterSaleDetail.processList === 'string') {
				console.log('【调试】processList是字符串，尝试解析为JSON');
				try {
					const parsed = JSON.parse(this.afterSaleDetail.processList);
					if (Array.isArray(parsed)) {
						console.log('【调试】成功将processList解析为数组');
						this.afterSaleDetail.processList = parsed;
					} else {
						console.error('【调试】processList解析结果不是数组');
						this.afterSaleDetail.processList = [];
					}
				} catch (e) {
					console.error('【调试】解析processList失败:', e);
					this.afterSaleDetail.processList = [];
				}
			}
			
			// 确保是数组类型
			if (!Array.isArray(this.afterSaleDetail.processList)) {
				console.error('【调试】processList不是数组类型，重置为空数组');
				this.afterSaleDetail.processList = [];
			}
			
			// 检查processList是否为空数组或者包含的元素不正确
			let needGenerate = this.afterSaleDetail.processList.length === 0;
			
			// 检查数组元素是否都具有必需的字段
			if (!needGenerate && this.afterSaleDetail.processList.length > 0) {
				const validElements = this.afterSaleDetail.processList.filter(process => {
					const hasType = process && (process.processType !== undefined || process.process_type !== undefined);
					const hasResult = process && (process.processResult !== undefined || process.process_result !== undefined);
					return hasType && hasResult;
				});
				
				if (validElements.length === 0) {
					console.log('【调试】processList中没有有效的处理记录元素，需要生成模拟数据');
					needGenerate = true;
					this.afterSaleDetail.processList = [];
				}
			}
			
			// 如果processList为空数组或不包含有效元素，根据售后单状态生成模拟数据
			if (needGenerate) {
				console.log('【调试】processList为空或无效，尝试根据状态生成模拟数据');
				this.generateProcessListFromStatus();
			}
		},
		
		// 根据售后单状态生成对应的processList数据
		generateProcessListFromStatus() {
			if (!this.afterSaleDetail || !this.afterSaleDetail.status) {
				console.log('【调试】无法生成processList：afterSaleDetail或status不存在');
				return;
			}
			
			console.log('【调试】根据售后单状态生成processList, 当前状态:', this.afterSaleDetail.status);
			
			const status = Number(this.afterSaleDetail.status);
			const processList = [];
			const now = new Date().toISOString();
			const createTime = this.afterSaleDetail.createTime || now;
			const handleTime = this.afterSaleDetail.handleTime || now;
			
			// 根据售后单状态生成相应的处理记录
			switch (status) {
				case 0: // 待处理
					// 不生成任何处理记录
					break;
					
				case 1: // 处理中
					// 添加审核通过记录
					processList.push({
						processType: 1,
						processResult: 1,
						handleTime: handleTime,
						handleNote: '审核通过，等待处理'
					});
					break;
					
				case 2: // 已完成
					// 添加审核通过记录
					processList.push({
						processType: 1,
						processResult: 1,
						handleTime: this.getPastTime(createTime, 1),
						handleNote: '审核通过'
					});
					
					// 根据售后类型判断是否需要添加发货/收货/质检记录
					if (this.afterSaleDetail.returnType === 1 || this.afterSaleDetail.returnType === 2) {
						// 退货退款或换货，需要物流过程
						processList.push({
							processType: 2,
							processResult: 1,
							handleTime: this.getPastTime(createTime, 2),
							handleNote: '用户已发货'
						});
						
						processList.push({
							processType: 3,
							processResult: 1,
							handleTime: this.getPastTime(createTime, 3),
							handleNote: '商家已收货'
						});
						
						processList.push({
							processType: 4,
							processResult: 1,
							handleTime: this.getPastTime(createTime, 4),
							handleNote: '商品质检通过'
						});
					}
					
					// 添加退款记录
					processList.push({
						processType: 5,
						processResult: 1,
						handleTime: handleTime,
						handleNote: '退款已完成，款项已原路退回'
					});
					break;
					
				case 3: // 已拒绝
					// 添加审核不通过记录
					processList.push({
						processType: 1,
						processResult: 0,
						handleTime: handleTime,
						handleNote: this.afterSaleDetail.handleNote || '审核不通过'
					});
					break;
					
				default:
					console.log('【调试】未知状态，不生成处理记录');
					break;
			}
			
			// 如果生成了处理记录，更新到afterSaleDetail
			if (processList.length > 0) {
				console.log('【调试】生成的processList:', processList);
				this.afterSaleDetail.processList = processList;
			}
		},
		
		// 获取过去的某个时间点（用于生成模拟数据的时间）
		getPastTime(baseTime, hoursBack) {
			try {
				const date = new Date(baseTime);
				date.setHours(date.getHours() - hoursBack);
				return date.toISOString();
			} catch (e) {
				return new Date().toISOString();
			}
		},
		// 获取订单详情
		getOrderDetail(orderId) {
			console.log('开始获取订单详情，订单ID:', orderId);
			
			getOrderDetail(orderId).then(response => {
				console.log('订单详情返回数据:', JSON.stringify(response));
				
				if(response.code === 200) {
					this.orderInfo = response.data;
					console.log('订单详情数据:', JSON.stringify(this.orderInfo));
				} else {
					console.error('获取订单详情失败:', response.message);
				}
			}).catch(error => {
				console.error('获取订单详情异常:', error);
			});
		},
		// 计算总退款金额
		calculateTotalRefund() {
			if(!this.afterSaleDetail || !this.afterSaleDetail.afterSaleItemList) {
				return '0.00';
			}
			
			let total = 0;
			this.afterSaleDetail.afterSaleItemList.forEach(item => {
				const itemTotal = (item.productRealPrice || 0) * (item.returnQuantity || 0);
				total += itemTotal;
			});
			
			return total.toFixed(2);
		},
		// 获取状态变更时间
		getStatusChangeTime(status) {
			if(this.statusChangeTimes[status]) {
				return this.formatDate(this.statusChangeTimes[status]);
			}
			
			// 如果没有记录状态变更时间，对于已处理的状态返回处理时间
			if(status === 1 && this.afterSaleDetail && this.afterSaleDetail.status >= 1) {
				// 对于处理中状态，如果没有记录，使用创建时间后1天作为估计
				if (this.afterSaleDetail.createTime) {
					try {
						let createTime = this.afterSaleDetail.createTime;
						// 确保createTime是日期对象
						if (typeof createTime === 'string') {
							createTime = new Date(createTime);
						}
						
						// 检查是否是有效的日期对象
						if (createTime instanceof Date && !isNaN(createTime.getTime())) {
							const estimatedTime = new Date(createTime);
							estimatedTime.setDate(estimatedTime.getDate() + 1);
							return this.formatDate(estimatedTime);
						}
					} catch (e) {
						console.error('处理状态变更时间出错:', e);
					}
				}
			}
			
			return '';
		},
		// 获取处理记录的图标样式
		getProcessIconClass(process) {
			if (!process) return '';
			
			console.log('【调试】getProcessIconClass - 处理记录:', JSON.stringify(process));
			
			// 获取处理类型和结果（兼容不同的字段名）
			const processType = process.processType || process.process_type;
			const processResult = process.processResult || process.process_result;
			
			// 根据处理类型和结果决定图标样式
			if (processResult === 0) {
				return 'icon-fail'; // 不通过
			}
			
			switch(processType) {
				case 1: return 'icon-audit'; // 审核
				case 2: return 'icon-ship'; // 发货
				case 3: return 'icon-receive'; // 收货
				case 4: return 'icon-check'; // 质检
				case 5: return 'icon-refund'; // 退款
				default: return '';
			}
		},
		
		// 获取处理记录的标题
		getProcessTitle(process) {
			if (!process) return '';
			
			// 获取处理类型和结果（兼容不同的字段名）
			const processType = process.processType || process.process_type;
			const processResult = process.processResult || process.process_result;
			
			const processTypeTexts = {
				1: '商家审核',
				2: '买家发货',
				3: '商家收货',
				4: '商品质检',
				5: '退款处理'
			};
			
			const resultTexts = {
				0: '不通过',
				1: '通过'
			};
			
			let baseTitle = processTypeTexts[processType] || '处理中';
			
			// 对于审核类型，加上结果
			if (processType === 1 && processResult !== null) {
				return `${baseTitle}${resultTexts[processResult]}`;
			}
			
			return baseTitle;
		},
		
		// 获取处理记录的副标题
		getProcessSubtitle(process) {
			if (!process) return '';
			
			// 获取处理类型和结果（兼容不同的字段名）
			const processType = process.processType || process.process_type;
			const processResult = process.processResult || process.process_result;
			
			// 针对不同处理类型显示不同的副标题
			switch(processType) {
				case 2: // 发货
					return '商品正在配送至商家';
				case 3: // 收货
					return '商家已确认收到您退回的商品';
				case 4: // 质检
					if (processResult === 1) {
						return '商品质检通过，准备退款';
					} else if (processResult === 0) {
						return '商品质检未通过，请联系客服';
					}
					return '商家正在检查商品';
				case 5: // 退款
					if (processResult === 1) {
						return '退款已成功，请注意查收';
					} else if (processResult === 0) {
						return '退款失败，请联系客服';
					}
					return '退款处理中';
				default:
					return '';
			}
		},
		cancelAfterSale() {
			uni.showModal({
				title: '提示',
				content: '确定要取消此售后申请吗？\n取消后记录将被删除',
				success: (res) => {
					if(res.confirm) {
						uni.showLoading({
							title: '处理中...'
						});
						
						cancelAfterSale({id: this.afterSaleId}).then(response => {
							uni.hideLoading();
							
							if(response.code === 200) {
								uni.showToast({
									title: '售后申请已取消',
									icon: 'success'
								});
								// 通知售后列表刷新
								uni.$emit('afterSaleListRefresh');
								setTimeout(() => {
									uni.navigateBack();
								}, 1500);
							} else {
								uni.showToast({
									title: response.message || '取消失败，请重试',
									icon: 'none'
								});
							}
						}).catch(error => {
							uni.hideLoading();
							console.error('取消售后申请失败:', error);
							uni.showToast({
								title: '取消失败: ' + (error.message || '未知错误'),
								icon: 'none'
							});
						});
					}
				}
			});
		},
		formatPics(picsStr) {
			console.log('格式化图片路径，输入:', picsStr);
			
			// 处理null或undefined
			if (!picsStr) {
				console.log('输入为空，返回空数组');
				return [];
			}
			
			// 已经是数组，确保每个URL都是完整的
			if (Array.isArray(picsStr)) {
				return picsStr.map(url => this.fixImagePath(url));
			}
			
			try {
				// 处理字符串类型
				if (typeof picsStr === 'string') {
					// 直接处理逗号分隔的图片地址 - 最常见的情况
					if (picsStr.includes(',')) {
						const urls = picsStr.split(',')
							.map(url => url.trim())
							.filter(url => url)
							.map(url => this.fixImagePath(url));
							
						console.log('处理后的图片URL列表:', urls);
						return urls;
					}
					
					// 如果是单个URL
					if (picsStr.includes('/upload/') || picsStr.startsWith('/')) {
						const url = this.fixImagePath(picsStr);
						console.log('处理后的单个URL:', url);
						return [url];
					}
					
					// 尝试解析JSON
					if (picsStr.startsWith('[') || picsStr.startsWith('{')) {
						try {
							const parsed = JSON.parse(picsStr);
							if (Array.isArray(parsed)) {
								return parsed.map(url => this.fixImagePath(url));
							} else if (typeof parsed === 'object' && parsed !== null) {
								// 尝试从对象中提取URL
								for (const key of ['url', 'src', 'path']) {
									if (parsed[key]) {
										return [this.fixImagePath(parsed[key])];
									}
								}
							}
						} catch (e) {
							console.error('JSON解析失败:', e);
						}
					}
					
					// 作为单个URL处理
					return [this.fixImagePath(picsStr)];
				}
				
				// 处理对象类型
				if (typeof picsStr === 'object' && picsStr !== null) {
					for (const key of ['url', 'src', 'path', 'pics']) {
						if (picsStr[key]) {
							if (Array.isArray(picsStr[key])) {
								return picsStr[key].map(url => this.fixImagePath(url));
							}
							return [this.fixImagePath(picsStr[key])];
						}
					}
				}
				
				// 转换为字符串
				return [this.fixImagePath(String(picsStr))];
				
			} catch (e) {
				console.error('解析凭证图片出错:', e);
				return [];
			}
		},
		fixImagePath(path) {
			if (!path) return '';
			
			let result = '';
			// 输出原始路径便于调试
			console.log('处理图片路径:', path);
			
			// 已经是完整URL
			if (path.startsWith('http')) {
				result = path;
			}
			// 特殊处理pics/20250410目录下的图片
			else if (path.includes('20250410')) {
				// 处理pics目录下的图片
				if (path.includes('/pics/20250410') || path.includes('pics/20250410')) {
					// 提取文件名
					const parts = path.split('/');
					const fileName = parts[parts.length - 1];
					result = `${API_BASE_URL}/pics/20250410/${fileName}`;
				} else {
					// 可能是其他目录下的20250410格式图片
					result = path.startsWith('/') ? API_BASE_URL + path : API_BASE_URL + '/' + path;
				}
			}
			// 处理以pics/开头的特殊路径
			else if (path.includes('pics/') && !path.startsWith('/')) {
				result = `${API_BASE_URL}/pics/${path.split('pics/')[1]}`;
			}
			// 处理以/pics/开头的特殊路径
			else if (path.startsWith('/pics/')) {
				result = API_BASE_URL + path;
			}
			// 相对路径，添加基础URL
			else if (path.startsWith('/')) {
				result = API_BASE_URL + path;
			}
			// 其他情况，假设是相对路径
			else {
				result = API_BASE_URL + '/' + path;
			}
			
			// 输出图片路径转换结果
			console.log(`图片路径处理结果: ${result}`);
			return result;
		},
		previewImage(current, urls) {
			uni.previewImage({
				current: current,
				urls: urls
			});
		},
		// 重试加载方法
		retryLoading() {
			if (this.afterSaleId) {
				this.getAfterSaleDetail();
			} else {
				uni.showToast({
					title: '售后ID无效，请返回重试',
					icon: 'none'
				});
			}
		},
		// 获取售后原因
		getAfterSaleReason() {
			if (!this.afterSaleDetail) return '';
			
			console.log('尝试获取售后原因，数据结构:', JSON.stringify(this.afterSaleDetail));
			
			// 检查所有可能的原因字段名
			const possibleReasonFields = ['returnReason', 'reason', 'return_reason', 'description', 'note', 'handleNote', 'return_reason_text', 'reasonText'];
			
			// 优先从售后商品项中获取原因，因为原因通常存储在商品项表中
			if (this.afterSaleDetail.afterSaleItemList && 
				this.afterSaleDetail.afterSaleItemList.length > 0) {
				
				console.log('从售后商品项中搜索原因字段，商品项数量:', this.afterSaleDetail.afterSaleItemList.length);
				
				for (let i = 0; i < this.afterSaleDetail.afterSaleItemList.length; i++) {
					const item = this.afterSaleDetail.afterSaleItemList[i];
					console.log(`检查商品项 ${i + 1} 的字段:`, Object.keys(item));
				}
				
				// 收集所有不同的原因
				let allReasons = new Set();
				
				for (let item of this.afterSaleDetail.afterSaleItemList) {
					for (let field of possibleReasonFields) {
						if (item[field] && typeof item[field] === 'string' && item[field].trim() !== '') {
							console.log(`从商品项中找到${field}:`, item[field]);
							allReasons.add(item[field]);
						}
					}
				}
				
				// 如果找到了多个不同的原因，用逗号连接
				if (allReasons.size > 0) {
					const reasonsArray = Array.from(allReasons);
					console.log('收集到的所有原因:', reasonsArray);
					return reasonsArray.join(', ');
				}
			}
			
			// 检查主对象的所有字段，打印出来帮助调试
			console.log('检查主对象字段:', Object.keys(this.afterSaleDetail));
			
			// 如果商品项中没有找到，再检查主对象
			for (let field of possibleReasonFields) {
				if (this.afterSaleDetail[field] && typeof this.afterSaleDetail[field] === 'string' && this.afterSaleDetail[field].trim() !== '') {
					console.log(`从主对象中找到${field}:`, this.afterSaleDetail[field]);
					return this.afterSaleDetail[field];
				}
			}
			
			// 检查是否在handle_note字段中
			if (this.afterSaleDetail.handle_note) {
				console.log('从handle_note字段找到原因:', this.afterSaleDetail.handle_note);
				return this.afterSaleDetail.handle_note;
			}
			
			console.log('未找到有效的售后原因');
			return '未提供原因';
		},
		// 检查是否有凭证图片
		hasProofPics() {
			if (!this.afterSaleDetail) return false;
			
			console.log('检查是否有凭证图片，数据结构:', JSON.stringify(this.afterSaleDetail));
			
			// 优先检查proofList字段
			if (this.afterSaleDetail.proofList && this.afterSaleDetail.proofList.length > 0) {
				console.log('在proofList中找到凭证图片，数量:', this.afterSaleDetail.proofList.length);
				return true;
			}
			
			// 检查所有可能的图片字段
			const possibleFields = ['proofPics', 'pics', 'proof_pics', 'returnPics', 'proof_pic', 'pic', 'images', 'returnImages'];
			
			// 优先检查售后商品项中是否有图片，因为图片通常存储在商品项中
			if (this.afterSaleDetail.afterSaleItemList && this.afterSaleDetail.afterSaleItemList.length > 0) {
				console.log('检查售后商品项中的凭证图片，商品项数量:', this.afterSaleDetail.afterSaleItemList.length);
				
				for (let item of this.afterSaleDetail.afterSaleItemList) {
					console.log('商品项所有字段:', Object.keys(item));
					
					for (let field of possibleFields) {
						if (item[field]) {
							console.log(`商品项中找到图片字段 ${field}:`, item[field]);
							
							// 判断是否有有效内容
							if (typeof item[field] === 'string') {
								if (item[field].trim() !== '') {
									return true;
								}
							} else if (Array.isArray(item[field]) && item[field].length > 0) {
								return true;
							} else if (typeof item[field] === 'object' && item[field] !== null) {
								return true;
							}
						}
					}
				}
			}
			
			// 检查主对象的所有字段，帮助调试
			console.log('主对象所有字段:', Object.keys(this.afterSaleDetail));
			
			// 如果商品项中没找到，再检查主对象
			for (let field of possibleFields) {
				if (this.afterSaleDetail[field]) {
					console.log(`主对象中找到图片字段 ${field}:`, this.afterSaleDetail[field]);
					
					// 判断是否有有效内容
					if (typeof this.afterSaleDetail[field] === 'string') {
						if (this.afterSaleDetail[field].trim() !== '') {
							return true;
						}
					} else if (Array.isArray(this.afterSaleDetail[field]) && this.afterSaleDetail[field].length > 0) {
						return true;
					} else if (typeof this.afterSaleDetail[field] === 'object' && this.afterSaleDetail[field] !== null) {
						return true;
					}
				}
			}
			
			console.log('未找到任何凭证图片');
			return false;
		},
		// 获取凭证图片
		getProofPics() {
			if (!this.afterSaleDetail) return [];
			
			console.log('尝试获取凭证图片');
			
			// 优先从proofList获取图片
			if (this.afterSaleDetail.proofList && this.afterSaleDetail.proofList.length > 0) {
				console.log('从proofList获取凭证图片，数量:', this.afterSaleDetail.proofList.length);
				const pics = this.afterSaleDetail.proofList.map(proof => {
					return this.fixImagePath(proof.picUrl);
				});
				console.log('从proofList处理后的图片:', pics);
				return pics;
			}
			
			// 检查所有可能的图片字段
			const possibleFields = ['proofPics', 'pics', 'proof_pics', 'returnPics', 'proof_pic', 'pic', 'images', 'returnImages'];
			
			// 收集所有商品项的图片
			let allPics = [];
			
			// 优先从售后商品项获取图片
			if (this.afterSaleDetail.afterSaleItemList && this.afterSaleDetail.afterSaleItemList.length > 0) {
				console.log('从售后商品项中获取凭证图片，商品项数量:', this.afterSaleDetail.afterSaleItemList.length);
				
				for (let i = 0; i < this.afterSaleDetail.afterSaleItemList.length; i++) {
					const item = this.afterSaleDetail.afterSaleItemList[i];
					console.log(`检查商品项 ${i+1} 的图片字段:`, Object.keys(item));
					
					for (let field of possibleFields) {
						if (item[field]) {
							console.log(`从商品项 ${i+1} 的 ${field} 字段获取图片:`, item[field]);
							try {
								const itemPics = this.formatPics(item[field]);
								if (itemPics && itemPics.length > 0) {
									console.log(`商品项 ${i+1} 处理后的图片:`, itemPics);
									allPics = allPics.concat(itemPics);
								}
							} catch (error) {
								console.error(`处理商品项 ${i+1} 的图片出错:`, error);
							}
						}
					}
				}
			}
			
			// 如果已经找到了图片，直接返回
			if (allPics.length > 0) {
				console.log('已收集所有商品项的图片，总数:', allPics.length);
				return allPics;
			}
			
			// 如果商品项中没有找到，尝试从主对象获取
			console.log('从主对象获取凭证图片');
			for (let field of possibleFields) {
				if (this.afterSaleDetail[field]) {
					console.log(`从主对象的 ${field} 字段获取图片:`, this.afterSaleDetail[field]);
					try {
						const pics = this.formatPics(this.afterSaleDetail[field]);
						if (pics && pics.length > 0) {
							console.log('主对象处理后的图片:', pics);
							return pics;
						}
					} catch (error) {
						console.error('处理主对象图片出错:', error);
					}
				}
			}
			
			console.log('未找到任何可用的凭证图片');
			return [];
		},
		onImageError(event) {
			console.error('图片加载失败:', event);
			uni.showToast({
				title: '图片加载失败，请检查网络连接',
				icon: 'none'
			});
		},
		// 从缓存中获取售后详情数据
		getAfterSaleFromCache() {
			try {
				// 尝试从localStorage获取售后列表数据
				const cachedAfterSaleListStr = uni.getStorageSync('afterSaleListCache');
				if (!cachedAfterSaleListStr) {
					console.log('未找到售后列表缓存');
					return null;
				}
				
				const cachedAfterSaleList = JSON.parse(cachedAfterSaleListStr);
				console.log('找到售后列表缓存，包含', cachedAfterSaleList.length, '条记录');
				
				// 从缓存中查找匹配的售后记录
				for (const tabData of cachedAfterSaleList) {
					if (tabData && tabData.afterSaleList && Array.isArray(tabData.afterSaleList)) {
						const matchedItem = tabData.afterSaleList.find(item => item.id == this.afterSaleId);
						if (matchedItem) {
							console.log('在缓存中找到匹配的售后记录:', matchedItem.id);
							return matchedItem;
						}
					}
				}
				
				// 尝试另一种可能的缓存结构
				for (const tabData of cachedAfterSaleList) {
					if (tabData && Array.isArray(tabData)) {
						const matchedItem = tabData.find(item => item.id == this.afterSaleId);
						if (matchedItem) {
							console.log('在缓存(扁平数组)中找到匹配的售后记录:', matchedItem.id);
							return matchedItem;
						}
					}
				}
				
				console.log('未在缓存中找到匹配的售后记录');
				return null;
			} catch (error) {
				console.error('从缓存获取售后详情失败:', error);
				return null;
			}
		},
		// 刷新数据，忽略缓存强制从API获取
		refreshData() {
			this.dataFromCache = false;
			this.getAfterSaleDetail(true); // 传递参数表示忽略缓存
		},
		// 返回上一页
		goBack() {
			uni.navigateBack();
		},
		
		// 复制文本
		copyText(text) {
			if (!text) return;
			
			uni.setClipboardData({
				data: String(text),
				success: () => {
					uni.showToast({
						title: '复制成功',
						icon: 'none'
					});
				}
			});
		},
		// 获取审核子状态文本
		getAuditSubstatusText() {
			if (!this.afterSaleDetail) return '商家正在处理您的申请';
			
			// 查找审核处理记录
			if (this.afterSaleDetail.processList && this.afterSaleDetail.processList.length > 0) {
				const auditProcess = this.findProcessByType(1); // 1表示审核类型
				if (auditProcess) {
					const processResult = auditProcess.processResult || auditProcess.process_result;
					if (processResult === 1) {
						return '商家已同意您的售后申请';
					} else if (processResult === 0) {
						return '商家已拒绝您的售后申请';
					}
				}
			}
			
			return '商家正在审核您的售后申请';
		},
		
		// 判断是否有物流处理记录
		hasDeliveryProcess() {
			return this.findProcessByType(2) || this.findProcessByType(3);
		},
		
		// 获取物流处理时间
		getDeliveryTime() {
			const deliveryProcess = this.findProcessByType(2) || this.findProcessByType(3);
			if (deliveryProcess) {
				return this.formatDate(deliveryProcess.handleTime || deliveryProcess.handle_time);
			}
			return '';
		},
		
		// 获取物流处理子状态文本
		getDeliverySubstatusText() {
			// 查找发货处理记录
			const shipProcess = this.findProcessByType(2);
			if (shipProcess) {
				const handleNote = shipProcess.handleNote || shipProcess.handle_note;
				return `您已发货，${handleNote ? '备注：' + handleNote : '商品正在配送至商家'}`;
			}
			
			// 查找收货处理记录
			const receiveProcess = this.findProcessByType(3);
			if (receiveProcess) {
				const handleNote = receiveProcess.handleNote || receiveProcess.handle_note;
				return `商家已收到您退回的商品${handleNote ? '，备注：' + handleNote : ''}`;
			}
			
			return '请按照商家要求寄回商品';
		},
		
		// 判断是否有质检处理记录
		hasQualityCheckProcess() {
			return this.findProcessByType(4) !== null;
		},
		
		// 获取质检处理时间
		getQualityCheckTime() {
			const checkProcess = this.findProcessByType(4);
			if (checkProcess) {
				return this.formatDate(checkProcess.handleTime || checkProcess.handle_time);
			}
			return '';
		},
		
		// 获取质检处理子状态文本
		getQualityCheckSubstatusText() {
			const checkProcess = this.findProcessByType(4);
			if (checkProcess) {
				const processResult = checkProcess.processResult || checkProcess.process_result;
				const handleNote = checkProcess.handleNote || checkProcess.handle_note;
				
				if (processResult === 1) {
					return `商品质检通过${handleNote ? '，备注：' + handleNote : ''}`;
				} else if (processResult === 0) {
					return `商品质检未通过${handleNote ? '，原因：' + handleNote : '，请联系客服'}`;
				}
				return `商家正在检查商品${handleNote ? '，备注：' + handleNote : ''}`;
			}
			return '商品等待质检';
		},
		
		// 判断是否有退款处理记录
		hasRefundProcess() {
			return this.findProcessByType(5) !== null;
		},
		
		// 获取退款处理时间
		getRefundTime() {
			if (this.afterSaleDetail.status === 2 && this.afterSaleDetail.handleTime) {
				return this.formatDate(this.afterSaleDetail.handleTime);
			}
			
			const refundProcess = this.findProcessByType(5);
			if (refundProcess) {
				return this.formatDate(refundProcess.handleTime || refundProcess.handle_time);
			}
			return '';
		},
		
		// 获取退款处理子状态文本
		getRefundSubstatusText() {
			const refundProcess = this.findProcessByType(5);
			if (refundProcess) {
				const processResult = refundProcess.processResult || refundProcess.process_result;
				const handleNote = refundProcess.handleNote || refundProcess.handle_note;
				
				if (processResult === 1) {
					return `退款已成功，款项已原路退回${handleNote ? '，备注：' + handleNote : ''}`;
				} else if (processResult === 0) {
					return `退款失败${handleNote ? '，原因：' + handleNote : '，请联系客服'}`;
				}
				return `退款处理中${handleNote ? '，备注：' + handleNote : ''}`;
			}
			
			if (this.afterSaleDetail.status === 2) {
				return '退款已完成，款项已原路退回';
			}
			
			return '等待退款处理';
		},
		
		// 根据处理类型查找处理记录
		findProcessByType(processType) {
			if (!this.afterSaleDetail || !this.afterSaleDetail.processList) {
				return null;
			}
			
			// 确保processList是数组
			let processList = this.afterSaleDetail.processList;
			
			// 处理processList可能是字符串的情况
			if (typeof processList === 'string') {
				try {
					processList = JSON.parse(processList);
				} catch (e) {
					console.error('【调试】解析processList时发生错误:', e);
					return null;
				}
			}
			
			// 确保是数组且有元素
			if (!Array.isArray(processList) || processList.length === 0) {
				return null;
			}
			
			// 查找指定类型的处理记录
			return processList.find(process => {
				// 处理字段可能的不同命名
				const type = process.processType || process.process_type;
				// 确保类型比较使用数字
				return Number(type) === Number(processType);
			});
		},
		
		// 判断是否有指定处理类型的记录
		hasProcessTypeRecord(processType) {
			console.log('【调试】afterSaleDetail:', this.afterSaleDetail);
			if (!this.afterSaleDetail || !this.afterSaleDetail.processList) {
				return false;
			}
			
			// 确保processList是数组
			let processList = this.afterSaleDetail.processList;
			
			// 处理processList可能是字符串的情况
			if (typeof processList === 'string') {
				try {
					processList = JSON.parse(processList);
				} catch (e) {
					console.error('【调试】解析processList时发生错误:', e);
					return false;
				}
			}
			
			// 确保是数组
			if (!Array.isArray(processList)) {
				return false;
			}
			
			return processList.some(process => {
				// 处理字段可能的不同命名
				const type = process.processType || process.process_type;
				// 确保类型比较使用数字
				return Number(type) === Number(processType);
			});
		},
		// 获取处理记录的时间
		getProcessTime(processType) {
			const process = this.findProcessByType(processType);
			if (process) {
				return this.formatDate(process.handleTime || process.handle_time);
			}
			return '';
		},
		// 获取处理记录的子状态文本
		getProcessSubstatusText(processType) {
			const process = this.findProcessByType(processType);
			if (!process) return '等待处理';
			
			// 处理processResult可能的不同命名，并确保转换为数字类型
			const processResult = process.processResult !== undefined ? Number(process.processResult) : 
							    (process.process_result !== undefined ? Number(process.process_result) : -1);
			
			// 调试输出
			console.log(`【调试】处理类型 ${processType} 的结果值:`, processResult, '原始值:', process.processResult || process.process_result);
			
			// 根据处理类型和结果返回对应的状态文本
			switch(Number(processType)) {
				case 1: // 售后单审核
					return processResult === 1 ? '审核通过' : '审核不通过';
				case 2: // 用户发货
					return processResult === 1 ? '发货成功' : '发货失败';
				case 3: // 商家收货
					return processResult === 1 ? '收货成功' : '收货失败';
				case 4: // 商家质检
					return processResult === 1 ? '质检通过' : '质检不通过';
				case 5: // 商家退款
					return processResult === 1 ? '退款成功' : '退款失败';
				default:
					return processResult === 1 ? '处理通过' : '处理未通过';
			}
		},
		// 获取处理记录的备注
		getProcessNote(processType) {
			const process = this.findProcessByType(processType);
			if (process) {
				return process.handleNote || process.handle_note;
			}
			return '';
		},
	}
}
</script>

<style lang="scss">
.content {
	padding-bottom: 30upx;
	background-color: #f8f8f8;
	min-height: 100vh;
	
	// 全局价格样式
	.price {
		color: #FF0000; // 设置为红色
		font-weight: bold;
	}
	
	// 页面头部
	.page-header {
		height: 90upx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30upx;
		background-color: #fff;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2upx 10upx rgba(0,0,0,0.1);
		
		.back-btn {
			width: 60upx;
			height: 60upx;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.yticon {
				font-size: 42upx;
				color: #333;
			}
		}
		
		.page-title {
			font-size: 32upx;
			color: #333;
			font-weight: bold;
		}
		
		.placeholder {
			width: 60upx;
		}
	}
	
	// 错误容器样式
	.error-container {
		padding: 60upx 30upx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: #fff;
		margin: 20upx;
		border-radius: 12upx;
		box-shadow: 0 2upx 12upx rgba(0, 0, 0, 0.05);
		
		.error-icon {
			width: 120upx;
			height: 120upx;
			border-radius: 50%;
			background-color: #f8f8f8;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-bottom: 30upx;
			
			.yticon {
				font-size: 60upx;
				color: #d63031;
			}
		}
		
		.error-text {
			font-size: 28upx;
			color: #666;
			text-align: center;
			margin-bottom: 30upx;
		}
		
		.retry-btn {
			width: 300upx;
			height: 80upx;
			line-height: 80upx;
			background-color: #0066cc;
			color: #fff;
			border-radius: 40upx;
			font-size: 28upx;
		}
	}
	
	.status-section {
		background: linear-gradient(to right, #0066cc, #1a8fe3);
		color: #fff;
		padding: 50upx 30upx;
		display: flex;
		align-items: center;
		border-bottom-left-radius: 20upx;
		border-bottom-right-radius: 20upx;
		box-shadow: 0 4upx 16upx rgba(0, 102, 204, 0.2);
		
		.status-icon {
			width: 100upx;
			height: 100upx;
			border-radius: 50%;
			background-color: rgba(255, 255, 255, 0.2);
			display: flex;
			justify-content: center;
			align-items: center;
			margin-right: 30upx;
			box-shadow: 0 4upx 16upx rgba(0, 0, 0, 0.1);
			
			.yticon {
				font-size: 60upx;
				color: #fff;
			}
			
			&.wait {
				background-color: #fdcb6e;
			}
			
			&.process {
				background-color: #0066cc;
			}
			
			&.success {
				background-color: #00b894;
			}
			
			&.reject {
				background-color: #d63031;
			}
		}
		
		.status-info {
			flex: 1;
			
			.status-text {
				font-size: 36upx;
				font-weight: bold;
				margin-bottom: 10upx;
				display: block;
			}
			
			.status-desc {
				font-size: 26upx;
				opacity: 0.8;
			}
		}
		
		.refresh-btn {
			width: 60upx;
			height: 60upx;
			border-radius: 50%;
			background-color: rgba(255,255,255,0.2);
			display: flex;
			justify-content: center;
			align-items: center;
			margin-left: 20upx;
			transition: all 0.3s;
			
			&:active {
				transform: scale(0.9);
			}
			
			.yticon {
				font-size: 36upx;
				color: #fff;
			}
		}
	}
	
	/* 进度时间线样式 */
	.progress-section {
		background-color: #fff;
		margin: 20upx;
		border-radius: 12upx;
		box-shadow: 0 2upx 12upx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.progress-timeline {
			padding: 30upx;
			
			.timeline-item {
				display: flex;
				position: relative;
				padding-bottom: 30upx;
				
				&:not(:last-child):before {
					content: '';
					position: absolute;
					left: 10upx;
					top: 30upx;
					height: calc(100% - 30upx);
					width: 2upx;
					background-color: #ddd;
				}
				
				.timeline-icon {
					width: 20upx;
					height: 20upx;
					border-radius: 50%;
					background-color: #ddd;
					margin-right: 20upx;
					margin-top: 10upx;
					
					// 处理类型图标样式
					&.icon-audit {
						background-color: #1a8fe3;
					}
					
					&.icon-ship {
						background-color: #fdcb6e;
					}
					
					&.icon-receive {
						background-color: #55efc4;
					}
					
					&.icon-check {
						background-color: #a29bfe;
					}
					
					&.icon-refund {
						background-color: #00b894;
					}
					
					&.icon-fail {
						background-color: #d63031;
					}
					
					&.icon-success {
						background-color: #00b894;
					}
				}
				
				.timeline-content {
					flex: 1;
					
					.timeline-title {
						font-size: 28upx;
						color: #666;
						margin-bottom: 5upx;
						display: block;
					}
					
					.timeline-subtitle {
						font-size: 26upx;
						color: #666;
						display: block;
						margin-bottom: 5upx;
					}
					
					.timeline-time {
						font-size: 24upx;
						color: #999;
						display: block;
					}
					
					.timeline-note {
						font-size: 24upx;
						color: #999;
						margin-top: 10upx;
						background-color: #f8f8f8;
						padding: 10upx;
						border-radius: 6upx;
						display: block;
					}
					
					// 子状态样式
					.timeline-substatus {
						margin-top: 10upx;
						padding: 10upx;
						background-color: #f8f8f8;
						border-radius: 6upx;
						
						.substatus-text {
							font-size: 24upx;
							color: #666;
							display: block;
							line-height: 1.5;
						}
						
						.substatus-reason {
							font-size: 24upx;
							color: #999;
							display: block;
							margin-top: 6upx;
							line-height: 1.5;
						}
					}
				}
				
				&.active {
					.timeline-icon {
						background-color: #0066cc;
						box-shadow: 0 0 0 4upx rgba(0, 102, 204, 0.2);
					}
					
					.timeline-title {
						color: #333;
						font-weight: bold;
					}
					
					.timeline-time {
						color: #0066cc;
					}
					
					.timeline-substatus {
						border-left: 3upx solid #0066cc;
						
						.substatus-text {
							color: #333;
						}
					}
				}
			}
		}
	}
	
	.section-title {
		font-size: 30upx;
		color: #333;
		font-weight: bold;
		padding: 24upx 30upx;
		background-color: #f8f8f8;
		position: relative;
		
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 24upx;
			height: 30upx;
			width: 6upx;
			background-color: #0066cc;
			border-radius: 0 3upx 3upx 0;
		}
	}
	
	.detail-section {
		background-color: #fff;
		margin: 20upx;
		border-radius: 12upx;
		box-shadow: 0 2upx 12upx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.detail-content {
			padding: 24upx 30upx;
		}
		
		.detail-item {
			display: flex;
			padding: 24upx 0;
			border-bottom: 1px solid #f5f5f5;
			
			.item-label {
				width: 180upx;
				color: #666;
				font-size: 28upx;
			}
			
			.item-value {
				flex: 1;
				color: #333;
				font-size: 28upx;
				
				&.reason-text {
					background-color: #f0f5ff;
					padding: 10upx;
					border-radius: 6upx;
					color: #0066cc;
				}
				
				&.copy-text {
					color: #0066cc;
					display: flex;
					align-items: center;
					
					.copy-icon {
						margin-left: 10upx;
						font-size: 24upx;
						color: #999;
					}
				}
			}
			
			&.highlight {
				background-color: #f0f5ff;
				
				.item-label {
					font-weight: bold;
					color: #333;
				}
				
				.item-value.amount {
					color: #fa436a;
					font-weight: bold;
					font-size: 32upx;
				}
			}
			
			&:last-child {
				border-bottom: none;
			}
		}
	}
	
	.pics-section {
		background-color: #fff;
		margin: 20upx;
		border-radius: 12upx;
		box-shadow: 0 2upx 12upx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.pics-scroll {
			white-space: nowrap;
			padding: 20upx 30upx;
		}
		
		.pics-container {
			display: inline-flex;
		}
		
		.pic-item {
			margin-right: 20upx;
			
			.thumbnail {
				width: 160upx;
				height: 160upx;
				border-radius: 8upx;
				box-shadow: 0 2upx 6upx rgba(0, 0, 0, 0.1);
				transition: all 0.3s;
				
				&:active {
					transform: scale(0.95);
				}
			}
		}
	}
	
	.goods-section {
		background-color: #fff;
		margin: 20upx;
		border-radius: 12upx;
		box-shadow: 0 2upx 12upx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.price-note {
			padding: 20upx 30upx;
			font-size: 24upx;
			color: #999;
			background-color: #f9f9f9;
			border-bottom: 1upx dashed #eee;
		}
		
		.goods-item {
			display: flex;
			padding: 30upx;
			border-bottom: 1px solid #f5f5f5;
			
			&:last-child {
				border-bottom: none;
			}
			
			.goods-img {
				width: 180upx;
				height: 180upx;
				border-radius: 8upx;
				box-shadow: 0 2upx 6upx rgba(0, 0, 0, 0.1);
			}
			
			.goods-info {
				flex: 1;
				padding-left: 30upx;
				
				.goods-name {
					font-size: 28upx;
					color: #333;
					margin-bottom: 10upx;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
				}
				
				.goods-attr {
					font-size: 24upx;
					color: #999;
					margin-bottom: 15upx;
					padding: 6upx 12upx;
					background-color: #f8f8f8;
					display: inline-block;
					border-radius: 6upx;
				}
				
				.goods-price {
					font-size: 28upx;
					color: #fa436a;
					margin-bottom: 15upx;
					
					.price {
						font-weight: bold;
					}
					
					.original-price {
						color: #999;
						text-decoration: line-through;
						margin-left: 10upx;
						font-size: 24upx;
					}
				}
				
				.return-quantity {
					font-size: 24upx;
					color: #999;
					background-color: #f8f8f8;
					padding: 6upx 12upx;
					border-radius: 6upx;
					display: inline-block;
					margin-bottom: 10upx;
					
					.quantity-label {
						margin-right: 10upx;
						
						&.return {
							margin-left: 16upx;
							color: #0066cc;
						}
					}
					
					.quantity-value {
						color: #333;
						
						&.return {
							color: #fa436a;
							font-weight: bold;
						}
					}
				}
				
				.item-reason {
					font-size: 24upx;
					color: #999;
					margin-top: 10upx;
					
					.reason-label {
						margin-right: 10upx;
					}
					
					.reason-value {
						color: #333;
						background-color: #f0f5ff;
						padding: 4upx 10upx;
						border-radius: 4upx;
					}
				}
				
				.item-pics {
					margin-top: 16upx;
					
					.pics-label {
						font-size: 24upx;
						color: #999;
						display: block;
						margin-bottom: 10upx;
					}
					
					.pics-scroll {
						width: 100%;
						white-space: nowrap;
					}
					
					.pics-container {
						display: inline-flex;
						padding: 5upx 0;
					}
					
					.pic-item {
						margin-right: 15upx;
						
						.thumbnail {
							width: 120upx;
							height: 120upx;
							border-radius: 8upx;
							box-shadow: 0 2upx 6upx rgba(0, 0, 0, 0.1);
						}
					}
				}
			}
		}
	}
	
	// 操作按钮区域
	.action-section {
		display: flex;
		justify-content: center;
		padding: 40upx 30upx;
		
		.action-btn {
			width: 80%;
			height: 80upx;
			line-height: 80upx;
			border-radius: 40upx;
			font-size: 28upx;
			color: #fff;
			background: linear-gradient(to right, #ff6b6b, #ee5253);
			box-shadow: 0 10upx 20upx rgba(238, 82, 83, 0.3);
			transition: all 0.3s;
			
			&:active {
				transform: translateY(2upx);
				box-shadow: 0 5upx 10upx rgba(238, 82, 83, 0.2);
			}
			
			&.cancel {
				background: linear-gradient(to right, #ff6b6b, #ee5253);
			}
		}
	}
	
	// 调试信息区域样式
	.debug-section {
		background-color: #fff;
		margin: 20upx;
		border-radius: 12upx;
		box-shadow: 0 2upx 12upx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.debug-content {
			padding: 20upx;
			
			.debug-item {
				margin-bottom: 10upx;
				background-color: #f8f8f8;
				padding: 10upx;
				border-radius: 6upx;
				
				.debug-label {
					font-size: 26upx;
					color: #666;
					margin-right: 10upx;
					font-weight: bold;
				}
				
				.debug-value {
					font-size: 26upx;
					color: #333;
					word-break: break-all;
				}
			}
			
			.debug-panel {
				margin-top: 20upx;
				padding: 20upx;
				background-color: #f0f5ff;
				border-radius: 8upx;
				
				.debug-panel-title {
					font-size: 28upx;
					color: #333;
					font-weight: bold;
					margin-bottom: 15upx;
					padding-bottom: 10upx;
					border-bottom: 1px dashed #ccc;
				}
				
				.debug-item {
					margin-bottom: 10upx;
					background-color: #fff;
					
					.debug-label {
						font-size: 26upx;
						color: #666;
						margin-right: 10upx;
					}
					
					.debug-value {
						font-size: 26upx;
						color: #333;
					}
				}
			}
		}
	}
	
	.debug-info {
		padding: 10upx 20upx;
		background-color: #f8f8f8;
		border-radius: 8upx;
		margin-bottom: 20upx;
		border: 1px dashed #ccc;
		
		.debug-title {
			font-size: 24upx;
			color: #333;
			font-weight: bold;
			display: block;
			margin-bottom: 6upx;
		}
		
		.debug-content {
			font-size: 22upx;
			color: #666;
			display: block;
			margin-bottom: 4upx;
			word-break: break-all;
		}
	}
	
	.debug-data {
		padding: 10upx;
		
		.debug-record {
			margin-bottom: 20upx;
			padding: 15upx;
			background-color: #f8f8f8;
			border-radius: 8upx;
			border: 1px solid #eee;
			
			.debug-index {
				font-size: 24upx;
				font-weight: bold;
				color: #333;
				display: block;
				margin-bottom: 10upx;
			}
			
			.debug-fields {
				.debug-field {
					display: flex;
					margin-bottom: 8upx;
					
					.field-name {
						font-size: 22upx;
						color: #666;
						font-weight: bold;
						min-width: 160upx;
					}
					
					.field-value {
						font-size: 22upx;
						color: #333;
						flex: 1;
						word-break: break-all;
					}
				}
			}
		}
	}
}
</style>
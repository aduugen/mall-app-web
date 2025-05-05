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
						<view class="item-reason" v-if="item.reason || item.returnReason">
							<text class="reason-label">退货原因:</text>
							<text class="reason-value">{{item.returnReason || item.reason}}</text>
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
			<!-- 调试信息区域 -->
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
			<!-- 处理记录原始数据（调试用） -->
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
	import {
		fetchAfterSaleDetail,
		cancelAfterSale,
		checkReturnShipStatus,
		submitReturnShipping
	} from '@/api/afterSale';
	
	export default {
		data() {
			return {
				afterSaleDetail: null, // 售后详情数据对象
				afterSaleId: null,     // 售后单ID
				loading: false,        // 加载状态
				loadError: false,      // 加载错误状态
				errorMessage: '',      // 错误信息
				dataFromCache: false,  // 数据是否来自缓存
				orderInfo: null,       // 订单信息
				debugMode: false,      // 关闭调试模式
				
				// 状态相关属性
				statusIconClass: '',   // 状态图标样式类
				statusIcon: '',        // 状态图标
				statusText: '',        // 状态文本
				statusDesc: '',        // 状态描述
				
				// 寄回商品相关数据
				canReturnShip: false, // 是否可以寄回商品
				returnShipMessage: '', // 寄回商品提示信息
				returnAddressInfo: {   // 初始化为空对象，而不是null
					address: '',
					name: '',
					phone: ''
				}, 
				returnShipForm: {
					afterSaleId: null,
					logisticsCompanyId: '',
					logisticsNumber: '',
					returnName: '',
					returnPhone: ''
				}
			};
		},
		// 注册过滤器
		filters: {
			// 格式化商品属性
			formatProductAttr(attrStr) {
				if (!attrStr) return '';
				
				try {
					// 尝试解析JSON格式的属性
					if (attrStr.startsWith('[') || attrStr.startsWith('{')) {
						const attrObj = JSON.parse(attrStr);
						
						// 数组格式
						if (Array.isArray(attrObj)) {
							return attrObj.map(item => {
								if (typeof item === 'object') {
									return `${item.key || ''}: ${item.value || ''}`;
								}
								return item;
							}).join('; ');
						}
						
						// 对象格式
						if (typeof attrObj === 'object') {
							return Object.keys(attrObj)
								.map(key => `${key}: ${attrObj[key]}`)
								.join('; ');
						}
					}
					
					// 普通字符串，直接返回
					return attrStr;
				} catch (e) {
					console.error('解析商品属性失败:', e);
					return attrStr;
				}
			}
		},
		computed: {
			// 过滤并格式化售后详情字段，用于调试显示
			filteredDetailFields() {
				if (!this.afterSaleDetail) return [];
				
				// 需要显示的字段
				const importantFields = [
					'id', 'orderId', 'status', 'reason', 'description', 'proofPics', 
					'handleTime', 'handleNote', 'createTime'
				];
				
				return Object.keys(this.afterSaleDetail)
					.filter(key => {
						// 排除对象和数组类型的复杂字段
						const value = this.afterSaleDetail[key];
						const isComplex = typeof value === 'object' && value !== null;
						return !isComplex || importantFields.includes(key);
					})
					.map(key => {
						return {
							key: key,
							value: this.afterSaleDetail[key]
						};
					});
			},
			
			// 第一个商品项字段，用于调试显示
			firstItemFields() {
				if (!this.afterSaleDetail || 
					!this.afterSaleDetail.afterSaleItemList || 
					this.afterSaleDetail.afterSaleItemList.length === 0) {
					return [];
				}
				
				const firstItem = this.afterSaleDetail.afterSaleItemList[0];
				return Object.keys(firstItem)
					.map(key => {
						return {
							key: key,
							value: firstItem[key]
						};
					});
			}
		},
		mounted() {
			// 获取afterSaleId参数
			this.afterSaleId = this.$route.query.id;
			if (this.afterSaleId) {
				this.loadAfterSaleDetail();
				// 检查是否可以寄回商品
				this.checkCanReturnShip();
			} else {
				this.loadError = true;
				this.errorMessage = '未指定售后单ID';
			}
		},
		methods: {
			// 格式化日期
			formatDate(timestamp) {
				if (!timestamp) return '-';
				
				try {
					const date = new Date(timestamp);
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hours = String(date.getHours()).padStart(2, '0');
					const minutes = String(date.getMinutes()).padStart(2, '0');
					
					return `${year}-${month}-${day} ${hours}:${minutes}`;
				} catch (e) {
					console.error('日期格式化错误:', e);
					return timestamp;
				}
			},
			
			// 更新状态信息
			updateStatusInfo() {
				if (!this.afterSaleDetail) return;
				
				// 根据售后状态设置相应的图标和文本
				const status = this.afterSaleDetail.status || 0;
				
				switch (status) {
					case 0: // 待处理
						this.statusIconClass = 'status-pending';
						this.statusIcon = 'icon-daifukuan';
						this.statusText = '待处理';
						this.statusDesc = '您的售后申请已提交，等待商家审核';
						break;
					case 1: // 处理中
						this.statusIconClass = 'status-processing';
						this.statusIcon = 'icon-daifahuo';
						this.statusText = '处理中';
						this.statusDesc = '商家正在处理您的售后申请';
						break;
					case 2: // 已完成
						this.statusIconClass = 'status-completed';
						this.statusIcon = 'icon-yishouhuo';
						this.statusText = '已完成';
						this.statusDesc = '售后服务已完成';
						break;
					case 3: // 已拒绝
						this.statusIconClass = 'status-rejected';
						this.statusIcon = 'icon-jujue';
						this.statusText = '已拒绝';
						this.statusDesc = '商家已拒绝您的售后申请';
						break;
					default:
						this.statusIconClass = 'status-unknown';
						this.statusIcon = 'icon-shuaxin';
						this.statusText = '未知状态';
						this.statusDesc = '售后状态未知';
				}
			},
			
			// 检查是否可以寄回商品
			checkCanReturnShip() {
				if (!this.afterSaleId) return;
				
				checkReturnShipStatus(this.afterSaleId).then(response => {
					if (response.code === 200) {
						this.canReturnShip = response.data.canReturn;
						this.returnShipMessage = response.data.message;
						// 确保即使后端返回null也能保持默认空对象
						this.returnAddressInfo = response.data.addressInfo || {
							address: '',
							name: '',
							phone: ''
						};
						
						// 如果有订单信息和收件人信息，自动填充表单
						if (this.orderInfo && this.orderInfo.receiverName) {
							this.returnShipForm.returnName = this.orderInfo.receiverName;
						}
						if (this.orderInfo && this.orderInfo.receiverPhone) {
							this.returnShipForm.returnPhone = this.orderInfo.receiverPhone;
						}
						this.returnShipForm.afterSaleId = this.afterSaleId;
					}
				}).catch(error => {
					console.error('检查寄回状态失败:', error);
					uni.showToast({
						title: '检查寄回状态失败',
						icon: 'none'
					});
				});
			},
			
			// 显示寄回商品模态框
			showReturnShipModal() {
				// 使用uni.showModal原生弹窗替代uni-popup组件
				uni.showModal({
					title: '寄回商品',
					content: '请联系客服获取退货地址，并填写物流信息',
					confirmText: '确定',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							// 用户点击确定
							console.log('用户点击确定');
						}
					}
				});
			},
			
			// 关闭寄回商品模态框
			closeReturnShipModal() {
				// 由于使用uni.showModal，这个方法暂时不需要实现
			},
			
			// 提交寄回物流信息
			submitReturnShipping() {
				// 表单验证
				if (!this.returnShipForm.logisticsCompanyId) {
					uni.showToast({
						title: '请输入物流公司',
						icon: 'none'
					});
					return;
				}
				
				if (!this.returnShipForm.logisticsNumber) {
					uni.showToast({
						title: '请输入物流单号',
						icon: 'none'
					});
					return;
				}
				
				if (!this.returnShipForm.returnName) {
					uni.showToast({
						title: '请输入寄件人姓名',
						icon: 'none'
					});
					return;
				}
				
				if (!this.returnShipForm.returnPhone) {
					uni.showToast({
						title: '请输入寄件人电话',
						icon: 'none'
					});
					return;
				}
				
				// 提交物流信息
				submitReturnShipping(this.returnShipForm).then(response => {
					if (response.code === 200) {
						uni.showToast({
							title: '提交成功',
							icon: 'success'
						});
						this.closeReturnShipModal();
						// 刷新售后详情
						this.loadAfterSaleDetail();
						// 重新检查是否可以寄回商品
						this.checkCanReturnShip();
					} else {
						uni.showToast({
							title: response.message || '提交失败',
							icon: 'none'
						});
					}
				}).catch(error => {
					console.error('提交物流信息失败:', error);
					uni.showToast({
						title: '提交失败，请稍后重试',
						icon: 'none'
					});
				});
			},
			
			// 加载售后详情
			loadAfterSaleDetail() {
				this.loading = true;
				this.loadError = false;
				
				console.log('开始加载售后详情, ID:', this.afterSaleId);
				
				return new Promise((resolve, reject) => {
					fetchAfterSaleDetail({id: this.afterSaleId})
						.then(response => {
							this.loading = false;
							console.log('API返回售后详情数据:', response);
							
							if (response.code === 200) {
								this.afterSaleDetail = response.data;
								
								// 记录关键数据结构到控制台
								console.log('售后数据解析 - afterSaleDetail:', this.afterSaleDetail);
								console.log('售后数据解析 - proofList:', this.afterSaleDetail.proofList);
								console.log('售后数据解析 - afterSaleItemList:', this.afterSaleDetail.afterSaleItemList);
								
								// 更新状态信息
								this.updateStatusInfo();
								
								// 检查是否可以寄回商品
								this.checkReturnShipStatus();
								
								resolve(this.afterSaleDetail);
							} else {
								this.loadError = true;
								this.errorMessage = response.message || '加载售后详情失败';
								reject(new Error(this.errorMessage));
							}
						})
						.catch(error => {
							this.loading = false;
							this.loadError = true;
							this.errorMessage = '网络异常，请稍后重试';
							console.error('获取售后详情异常:', error);
							reject(error);
						});
				});
			},
			
			// 检查是否可以寄回商品
			checkReturnShipStatus() {
				this.canReturnShip = false;
				
				console.log('检查售后单是否可以寄回商品:', this.afterSaleId);
				
				if (!this.afterSaleDetail) {
					console.log('无售后详情数据，无法检查寄回状态');
					return;
				}
				
				console.log('售后单状态:', this.afterSaleDetail.status);
				console.log('售后单是否有处理记录:', this.afterSaleDetail.processList && this.afterSaleDetail.processList.length > 0);
				
				// 检查是否有process_type=1且process_result=1的处理记录
				if (this.afterSaleDetail.processList && this.afterSaleDetail.processList.length > 0) {
					const hasValidProcess = this.afterSaleDetail.processList.some(process => {
						const processType = process.processType !== undefined ? 
							Number(process.processType) : (process.process_type !== undefined ? 
							Number(process.process_type) : -1);
							
						const processResult = process.processResult !== undefined ? 
							Number(process.processResult) : (process.process_result !== undefined ? 
							Number(process.process_result) : -1);
							
						const isValid = processType === 1 && processResult === 1;
						
						console.log(`处理记录: 类型=${processType}, 结果=${processResult}, 是否符合寄回条件: ${isValid}`);
						
						return isValid;
					});
					
					if (hasValidProcess) {
						console.log('找到有效的处理记录，可以寄回商品');
						this.canReturnShip = true;
					}
				}
				
				// 如果有returnShipStatus且值为0，表示待寄回商品状态
				if (this.afterSaleDetail.returnShipStatus !== undefined && this.afterSaleDetail.returnShipStatus === 0) {
					console.log('售后单具有returnShipStatus=0，可以寄回商品');
					this.canReturnShip = true;
				}
				
				// 如果状态是1（处理中）且没有寄回物流信息，则认为可以寄回商品
				if (this.afterSaleDetail.status === 1 && !this.afterSaleDetail.returnLogistics) {
					console.log('售后单状态为处理中且无寄回物流信息，可以寄回商品');
					this.canReturnShip = true;
				}
				
				console.log('最终寄回商品状态判断结果:', this.canReturnShip);
			},
			
			// 获取售后原因
			getAfterSaleReason() {
				if (!this.afterSaleDetail) return '';
				
				console.log('售后原因 - 顶级reason字段:', this.afterSaleDetail.reason);
				
				if (this.afterSaleDetail.afterSaleItemList && this.afterSaleDetail.afterSaleItemList.length > 0) {
					const firstItem = this.afterSaleDetail.afterSaleItemList[0];
					console.log('售后原因 - 第一个商品项returnReason:', firstItem.returnReason);
					console.log('售后原因 - 第一个商品项reason:', firstItem.reason);
				}
				
				// 尝试从不同的字段获取售后原因
				return this.afterSaleDetail.reason || 
					(this.afterSaleDetail.afterSaleItemList && 
					this.afterSaleDetail.afterSaleItemList[0] && 
					(this.afterSaleDetail.afterSaleItemList[0].returnReason || 
					this.afterSaleDetail.afterSaleItemList[0].reason)) || 
					'未提供原因';
			},
			
			// 计算总退款金额
			calculateTotalRefund() {
				if (!this.afterSaleDetail || !this.afterSaleDetail.afterSaleItemList) return 0;
				
				return this.afterSaleDetail.afterSaleItemList.reduce((total, item) => {
					const price = Number(item.productRealPrice || item.productPrice || 0);
					const quantity = Number(item.returnQuantity || 0);
					return total + (price * quantity);
				}, 0).toFixed(2);
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			},
			
			// 重新加载
			retryLoading() {
				this.loadAfterSaleDetail();
			},
			
			// 刷新数据
			refreshData() {
				this.dataFromCache = false;
				this.loadAfterSaleDetail();
			},
			
			// 检查是否有处理记录
			hasProcessTypeRecord(processType) {
				if (!this.afterSaleDetail || !this.afterSaleDetail.processList) return false;
				
				return this.afterSaleDetail.processList.some(process => {
					const type = process.processType !== undefined ? 
						Number(process.processType) : (process.process_type !== undefined ? 
						Number(process.process_type) : -1);
					
					return type === processType;
				});
			},
			
			// 获取处理时间
			getProcessTime(processType) {
				if (!this.afterSaleDetail || !this.afterSaleDetail.processList) return '';
				
				const process = this.afterSaleDetail.processList.find(p => {
					const type = p.processType !== undefined ? 
						Number(p.processType) : (p.process_type !== undefined ? 
						Number(p.process_type) : -1);
					
					return type === processType;
				});
				
				return process ? this.formatDate(process.createTime || process.create_time) : '';
			},
			
			// 获取处理状态文本
			getProcessSubstatusText(processType) {
				if (!this.afterSaleDetail || !this.afterSaleDetail.processList) return '';
				
				const process = this.afterSaleDetail.processList.find(p => {
					const type = p.processType !== undefined ? 
						Number(p.processType) : (p.process_type !== undefined ? 
						Number(p.process_type) : -1);
					
					return type === processType;
				});
				
				if (!process) return '';
				
				const result = process.processResult !== undefined ? 
					Number(process.processResult) : (process.process_result !== undefined ? 
					Number(process.process_result) : -1);
				
				switch(processType) {
					case 1: // 售后单审核
						return result === 1 ? '审核通过' : (result === 2 ? '审核拒绝' : '审核中');
					case 2: // 用户发货
						return '用户已发货';
					case 3: // 商家收货
						return '商家已收货';
					case 4: // 商家质检
						return result === 1 ? '质检通过' : (result === 2 ? '质检不通过' : '质检中');
					case 5: // 商家退款
						return '已退款';
					default:
						return '';
				}
			},
			
			// 获取处理备注
			getProcessNote(processType) {
				if (!this.afterSaleDetail || !this.afterSaleDetail.processList) return '';
				
				const process = this.afterSaleDetail.processList.find(p => {
					const type = p.processType !== undefined ? 
						Number(p.processType) : (p.process_type !== undefined ? 
						Number(p.process_type) : -1);
					
					return type === processType;
				});
				
				return process ? (process.note || process.processNote || '') : '';
			},
			
			// 检查是否有凭证图片
			hasProofPics() {
				if (!this.afterSaleDetail) return false;
				
				// 调试输出
				console.log('检查凭证图片 - proofPics:', this.afterSaleDetail.proofPics);
				console.log('检查凭证图片 - proofList:', this.afterSaleDetail.proofList);
				
				// 检查proofList数组
				if (this.afterSaleDetail.proofList && this.afterSaleDetail.proofList.length > 0) {
					console.log('从proofList获取到凭证图片');
					return true;
				}
				
				// 检查顶级proofPics字段
				if (this.afterSaleDetail.proofPics && this.afterSaleDetail.proofPics.trim() !== '') {
					console.log('从售后单获取到凭证图片');
					return true;
				}
				
				// 检查afterSaleItemList中的图片
				if (this.afterSaleDetail.afterSaleItemList && this.afterSaleDetail.afterSaleItemList.length > 0) {
					const hasItemPics = this.afterSaleDetail.afterSaleItemList.some(item => {
						const hasPics = item.pics && item.pics.trim() !== '';
						const hasProofPics = item.proofPics && item.proofPics.trim() !== '';
						
						// 调试输出
						if (hasPics || hasProofPics) {
							console.log('从商品项获取到凭证图片:', item.pics || item.proofPics);
						}
						
						return hasPics || hasProofPics;
					});
					
					return hasItemPics;
				}
				
				console.log('未找到凭证图片');
				return false;
			},
			
			// 获取凭证图片
			getProofPics() {
				if (!this.afterSaleDetail) return [];
				
				let allPics = [];
				
				// 从proofList数组获取
				if (this.afterSaleDetail.proofList && this.afterSaleDetail.proofList.length > 0) {
					console.log('从proofList获取凭证图片:', this.afterSaleDetail.proofList);
					this.afterSaleDetail.proofList.forEach(proof => {
						if (proof.picUrl) {
							allPics.push(this.fixImagePath(proof.picUrl));
						}
					});
				}
				
				// 从售后单直接获取
				if (this.afterSaleDetail.proofPics && this.afterSaleDetail.proofPics.trim() !== '') {
					console.log('从售后单获取凭证图片:', this.afterSaleDetail.proofPics);
					allPics = allPics.concat(this.formatPics(this.afterSaleDetail.proofPics));
				}
				
				// 从售后项中获取
				if (this.afterSaleDetail.afterSaleItemList && this.afterSaleDetail.afterSaleItemList.length > 0) {
					this.afterSaleDetail.afterSaleItemList.forEach(item => {
						// 检查pics字段
						if (item.pics && item.pics.trim() !== '') {
							console.log(`商品 ${item.productName} 的pics:`, item.pics);
							allPics = allPics.concat(this.formatPics(item.pics));
						}
						
						// 检查proofPics字段
						if (item.proofPics && item.proofPics.trim() !== '') {
							console.log(`商品 ${item.productName} 的proofPics:`, item.proofPics);
							allPics = allPics.concat(this.formatPics(item.proofPics));
						}
					});
				}
				
				console.log('最终凭证图片列表:', allPics);
				return allPics;
			},
			
			// 格式化图片列表
			formatPics(picsStr) {
				if (!picsStr) return [];
				
				console.log('格式化图片路径，原始数据类型:', typeof picsStr, picsStr);
				
				let result = [];
				
				if (typeof picsStr === 'string') {
					// 处理逗号分隔的字符串
					result = picsStr
						.split(',')
						.filter(p => p && p.trim() !== '')
						.map(p => this.fixImagePath(p.trim()));
				} else if (Array.isArray(picsStr)) {
					// 处理数组格式
					result = picsStr
						.filter(p => p && p.trim && p.trim() !== '')
						.map(p => this.fixImagePath(p.trim ? p.trim() : p));
				}
				
				console.log('格式化后的图片路径:', result);
				return result;
			},
			
			// 修复图片路径
			fixImagePath(path) {
				if (!path) return '';
				
				// 已经是完整URL的情况
				if (path.startsWith('http://') || path.startsWith('https://')) {
					return path;
				}
				
				// 远程服务器地址
				const baseUrl = 'http://192.168.1.6:8085';
				
				// 相对路径的情况，添加域名
				if (path.startsWith('/')) {
					return `${baseUrl}${path}`;
				} else {
					return `${baseUrl}/${path}`;
				}
			},
			
			// 预览图片
			previewImage(current, urls) {
				uni.previewImage({
					current: current,
					urls: urls || [current]
				});
			},
			
			// 复制文本
			copyText(text) {
				uni.setClipboardData({
					data: text,
					success: () => {
						uni.showToast({
							title: '复制成功',
							icon: 'success'
						});
					}
				});
			},
			
			// 图片加载错误处理
			onImageError(e) {
				console.log('图片加载错误:', e);
			}
		}
	}
</script>

<style lang="scss">
	.content {
		padding-bottom: 100rpx;
		background-color: #f8f8f8;
	}
	
	.page-header {
		display: flex;
		align-items: center;
		height: 90rpx;
		background-color: #ffffff;
		padding: 0 30rpx;
		position: relative;
		
		.back-btn {
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.yticon {
				font-size: 40rpx;
				color: #333;
			}
		}
		
		.page-title {
			flex: 1;
			text-align: center;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-left: -60rpx; /* 抵消返回按钮的宽度，保持标题居中 */
		}
		
		.placeholder {
			width: 60rpx;
		}
	}
	
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
		
		.error-icon {
			font-size: 100rpx;
			color: #003366;
			margin-bottom: 30rpx;
		}
		
		.error-text {
			font-size: 28rpx;
			color: #666;
			margin-bottom: 40rpx;
		}
		
		.retry-btn {
			padding: 15rpx 40rpx;
			background-color: #003366;
			color: #fff;
			border-radius: 40rpx;
			font-size: 28rpx;
		}
	}
	
	.status-section {
		background-color: #003366;
		padding: 40rpx 30rpx;
		display: flex;
		align-items: center;
		position: relative;
		
		.status-icon {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			background-color: rgba(255, 255, 255, 0.2);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 20rpx;
			
			.yticon {
				font-size: 40rpx;
				color: #fff;
			}
			
			&.status-pending {
				background-color: rgba(255, 255, 255, 0.2);
			}
			
			&.status-processing {
				background-color: rgba(255, 255, 255, 0.2);
			}
			
			&.status-completed {
				background-color: rgba(255, 255, 255, 0.2);
			}
			
			&.status-rejected {
				background-color: rgba(255, 255, 255, 0.2);
			}
		}
		
		.status-info {
			flex: 1;
			
			.status-text {
				font-size: 32rpx;
				font-weight: bold;
				color: #fff;
				margin-bottom: 10rpx;
				display: block;
			}
			
			.status-desc {
				font-size: 26rpx;
				color: rgba(255, 255, 255, 0.8);
				display: block;
			}
		}
		
		.refresh-btn {
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.yticon {
				font-size: 40rpx;
				color: #fff;
			}
		}
	}
	
	.progress-section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 10rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.section-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
			position: relative;
			padding-left: 20rpx;
			
			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 6rpx;
				height: 30rpx;
				background-color: #003366;
				border-radius: 3rpx;
			}
		}
		
		.progress-timeline {
			padding-left: 30rpx;
			position: relative;
			
			&::before {
				content: '';
				position: absolute;
				left: 12rpx;
				top: 10rpx;
				bottom: 10rpx;
				width: 2rpx;
				background-color: #ddd;
			}
			
			.timeline-item {
				position: relative;
				padding-bottom: 50rpx;
				padding-left: 40rpx;
				
				&:last-child {
					padding-bottom: 0;
				}
				
				.timeline-icon {
					position: absolute;
					left: -10rpx;
					top: 10rpx;
					width: 20rpx;
					height: 20rpx;
					border-radius: 50%;
					background-color: #ddd;
					z-index: 2;
				}
				
				.timeline-content {
					.timeline-title {
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 8rpx;
						display: block;
					}
					
					.timeline-time {
						font-size: 24rpx;
						color: #999;
						margin-bottom: 15rpx;
						display: block;
					}
					
					.timeline-substatus {
						background-color: #f8f8f8;
						padding: 15rpx;
						border-radius: 8rpx;
						
						.substatus-text {
							font-size: 26rpx;
							color: #666;
							display: block;
							margin-bottom: 8rpx;
						}
						
						.substatus-reason {
							font-size: 24rpx;
							color: #999;
							display: block;
						}
					}
				}
				
				&.active {
					.timeline-icon {
						background-color: #003366;
						box-shadow: 0 0 0 4rpx rgba(0, 51, 102, 0.2);
					}
					
					.timeline-title {
						color: #003366;
					}
				}
			}
		}
	}
	
	.detail-section, .goods-section, .pics-section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 10rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.section-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
			position: relative;
			padding-left: 20rpx;
			
			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 6rpx;
				height: 30rpx;
				background-color: #003366;
				border-radius: 3rpx;
			}
		}
	}
	
	.detail-section {
		.detail-content {
			.detail-item {
				display: flex;
				align-items: flex-start;
				margin-bottom: 20rpx;
				
				.item-label {
					width: 160rpx;
					font-size: 26rpx;
					color: #666;
					flex-shrink: 0;
				}
				
				.item-value {
					flex: 1;
					font-size: 26rpx;
					color: #333;
					word-break: break-all;
					
					&.copy-text {
						display: flex;
						align-items: center;
						
						.copy-icon {
							margin-left: 10rpx;
							font-size: 26rpx;
							color: #999;
						}
					}
				}
				
				.price {
					color: #e54d42;
					font-weight: bold;
				}
			}
		}
	}
	
	.pics-section {
		.pics-scroll {
			width: 100%;
			white-space: nowrap;
			
			.pics-container {
				display: inline-flex;
				
				.pic-item {
					width: 180rpx;
					height: 180rpx;
					margin-right: 15rpx;
					border-radius: 8rpx;
					overflow: hidden;
					
					.thumbnail {
						width: 100%;
						height: 100%;
					}
				}
			}
		}
	}
	
	.goods-section {
		.price-note {
			font-size: 24rpx;
			color: #999;
			margin-bottom: 20rpx;
			display: block;
		}
		
		.goods-item {
			display: flex;
			padding: 20rpx 0;
			border-bottom: 1rpx solid #f5f5f5;
			
			&:last-child {
				border-bottom: none;
			}
			
			.goods-img {
				width: 160rpx;
				height: 160rpx;
				border-radius: 8rpx;
				margin-right: 20rpx;
				background-color: #f8f8f8;
				flex-shrink: 0;
			}
			
			.goods-info {
				flex: 1;
				
				.goods-name {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 10rpx;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				
				.goods-attr {
					font-size: 24rpx;
					color: #999;
					margin-bottom: 15rpx;
					display: block;
				}
				
				.goods-price {
					display: flex;
					align-items: center;
					margin-bottom: 15rpx;
					
					.price {
						font-size: 28rpx;
						color: #e54d42;
						font-weight: bold;
					}
					
					.original-price {
						font-size: 24rpx;
						color: #999;
						text-decoration: line-through;
						margin-left: 10rpx;
					}
				}
				
				.return-quantity {
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					margin-bottom: 15rpx;
					
					.quantity-label, .quantity-value {
						font-size: 24rpx;
						color: #666;
					}
					
					.quantity-label {
						margin-right: 10rpx;
					}
					
					.quantity-value {
						margin-right: 20rpx;
					}
					
					.quantity-label.return, .quantity-value.return {
						color: #003366;
					}
				}
				
				.item-reason {
					margin-bottom: 15rpx;
					
					.reason-label {
						font-size: 24rpx;
						color: #666;
						margin-right: 10rpx;
					}
					
					.reason-value {
						font-size: 24rpx;
						color: #333;
					}
				}
				
				.item-pics {
					margin-top: 15rpx;
					
					.pics-label {
						font-size: 24rpx;
						color: #666;
						display: block;
						margin-bottom: 10rpx;
					}
					
					.pics-scroll {
						width: 100%;
						
						.pics-container {
							display: inline-flex;
							
							.pic-item {
								width: 120rpx;
								height: 120rpx;
								margin-right: 10rpx;
								border-radius: 6rpx;
								overflow: hidden;
								
								.thumbnail {
									width: 100%;
									height: 100%;
								}
							}
						}
					}
				}
			}
		}
	}
	
	/* 调试信息区域样式 */
	.debug-section {
		background-color: #f8f8f8;
		margin: 20rpx;
		border-radius: 10rpx;
		padding: 30rpx;
		border: 1rpx dashed #ddd;
		
		.section-title {
			font-size: 26rpx;
			color: #666;
			margin-bottom: 20rpx;
		}
		
		.debug-content {
			.debug-item {
				display: flex;
				margin-bottom: 10rpx;
				
				.debug-label {
					width: 180rpx;
					font-size: 24rpx;
					color: #666;
					flex-shrink: 0;
				}
				
				.debug-value {
					flex: 1;
					font-size: 24rpx;
					color: #333;
					word-break: break-all;
				}
			}
			
			.debug-panel {
				margin-top: 20rpx;
				padding-top: 20rpx;
				border-top: 1rpx dashed #eee;
				
				.debug-panel-title {
					font-size: 24rpx;
					color: #666;
					margin-bottom: 15rpx;
				}
			}
		}
		
		.debug-data {
			.debug-record {
				margin-bottom: 20rpx;
				padding-bottom: 15rpx;
				border-bottom: 1rpx dashed #eee;
				
				&:last-child {
					border-bottom: none;
					margin-bottom: 0;
				}
				
				.debug-index {
					font-size: 24rpx;
					color: #003366;
					margin-bottom: 10rpx;
					display: block;
				}
				
				.debug-fields {
					padding-left: 20rpx;
					
					.debug-field {
						display: flex;
						margin-bottom: 5rpx;
						
						.field-name {
							width: 120rpx;
							font-size: 24rpx;
							color: #666;
							flex-shrink: 0;
						}
						
						.field-value {
							flex: 1;
							font-size: 24rpx;
							color: #333;
							word-break: break-all;
						}
					}
				}
			}
		}
	}
	
	.popup-header {
		padding: 24rpx;
		border-bottom: 1px solid #f5f5f5;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.popup-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}
	
	.popup-content {
		padding: 30rpx;
	}
	
	.address-info {
		background: #f8f8f8;
		padding: 20rpx;
		border-radius: 8rpx;
		margin-bottom: 30rpx;
	}
	
	.address-label {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 10rpx;
		display: block;
	}
	
	.address-value {
		font-size: 28rpx;
		color: #333;
		line-height: 1.5;
	}
	
	.form-item {
		margin-bottom: 24rpx;
	}
	
	.form-label {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 12rpx;
		display: block;
	}
	
	.form-input {
		width: 100%;
		height: 80rpx;
		border: 1px solid #ddd;
		border-radius: 4rpx;
		padding: 0 20rpx;
		box-sizing: border-box;
		font-size: 28rpx;
	}
	
	.popup-footer {
		padding: 0 30rpx;
		margin-bottom: 30rpx;
	}
	
	.submit-btn {
		width: 100%;
		height: 80rpx;
		background: #003366;
		color: #fff;
		font-size: 30rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.return-ship-popup {
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		padding-bottom: 30rpx;
	}
</style>
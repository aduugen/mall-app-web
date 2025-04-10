<template>
	<view class="content">
		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view 
				v-for="(item, index) in navList" :key="index" 
				class="nav-item" 
				:class="{current: tabCurrentIndex === index}"
				@click="tabClick(index)"
			>
				{{item.text}}
			</view>
			<!-- 刷新按钮 -->
			<view class="refresh-btn" @click="refreshCurrentTab">
				<text class="iconfont icon-refresh">刷新</text>
			</view>
		</view>
		
		<!-- 内容区域 -->
		<swiper class="swiper-box" :current="tabCurrentIndex" @change="changeTab">
			<!-- 循环渲染每个标签页 -->
			<swiper-item class="tab-content" v-for="(tabItem, tabIndex) in navList" :key="tabIndex">
				<scroll-view 
					class="list-scroll-content" 
					scroll-y 
					@scrolltolower="onScrolltolower" 
					@refresherrefresh="onRefresh" 
					:refresher-enabled="true"
					:refresher-triggered="tabItem.refreshing"
					refresher-background="#f8f8f8"
				>
					<!-- 加载状态 -->
					<view v-if="tabItem.loading && !tabItem.refreshing" class="loading-container">
						<view class="loading-spinner"></view>
						<text class="loading-text">加载中...</text>
					</view>
					
					<!-- 显示调试信息 -->
					<view class="debug-info" v-if="tabItem.afterSaleList.length === 0 && isDebug">
						<text>当前选项卡: {{tabIndex}}, 当前索引: {{tabCurrentIndex}}</text>
					</view>
					
					<!-- 无数据状态 -->
					<view v-else-if="tabItem.afterSaleList.length === 0 && !tabItem.loading" class="empty-box">
						<image class="empty-icon" src="/static/images/empty.png" mode="aspectFit"></image>
						<view class="empty-text">
							{{ tabCurrentIndex === 0 ? '暂无售后申请记录' : 
							   tabCurrentIndex === 1 ? '暂无处理中的售后记录' :
							   tabCurrentIndex === 2 ? '暂无已完成的售后记录' : '暂无售后记录' }}
						</view>
						<view class="retry-btn" @click="refreshCurrentTab">重新加载</view>
					</view>
					
					<!-- 售后列表区 -->
					<view class="after-sale-list" v-else>
						<view class="after-sale-item" v-for="(item, idx) in tabItem.afterSaleList" :key="idx" @click="viewDetails(item)">
							<view class="i-top b-b">
								<text class="service-id">售后单号: {{item.id}}</text>
								<text class="state" :class="'status-' + item.status">{{getStatusText(item.status)}}</text>
							</view>
							<view class="order-num b-b">
								<text>订单号: {{item.orderSn}}</text>
								<text class="create-time">{{formatDate(item.createTime)}}</text>
							</view>
							<view class="i-content">
								<view class="product-list" v-if="item.afterSaleItemList && item.afterSaleItemList.length > 0">
									<view class="product-item" v-for="(product, productIndex) in item.afterSaleItemList" :key="productIndex">
										<image class="product-img" :src="fixImagePath(product.productPic)" mode="aspectFill"></image>
										<view class="product-info">
											<view class="product-name">{{product.productName}}</view>
											<view class="product-attr" v-if="product.productAttr">{{formatProductAttr(product.productAttr)}}</view>
											<view class="product-price-qty">
												<text>单价: ¥{{product.productPrice}}</text>
												<text>退货数量: {{product.returnQuantity || 0}}</text>
											</view>
											<view class="product-reason" v-if="product.returnReason">
												退货原因: {{product.returnReason}}
											</view>
											
									<!-- 商品项的凭证图片 -->
									<view class="proof-images" v-if="getLimitedProductProofPics(product).length > 0">
										<view class="image-label">凭证图片：</view>
										<view class="image-list">
											<image
												v-for="(pic, picIndex) in getLimitedProductProofPics(product)" 
												:key="picIndex"
												class="proof-image"
												:src="pic"
												mode="aspectFill"
												@click.stop="previewImage(pic, getLimitedProductProofPics(product))"
											/>
											<text v-if="getProductProofPics(product).length > 5" class="more-images">+{{getProductProofPics(product).length - 5}}</text>
										</view>
									</view>
										</view>
									</view>
								</view>
								
								<view class="i-info b-b">
									<view class="info-item">
										<text class="title">退货总数:</text>
										<text class="content">{{calcTotalQuantity(item)}}件</text>
									</view>
									<view class="info-item">
										<text class="title">退款金额:</text>
										<text class="content price">¥{{calcTotalAmount(item)}}</text>
									</view>
									<view class="info-item" v-if="item.handleTime">
										<text class="title">处理时间:</text>
										<text class="content">{{formatDate(item.handleTime)}}</text>
									</view>
								</view>
								
								<view class="certificate-images" v-if="item.proofPics && item.proofPics.length > 0">
									<view class="certificate-title">凭证图片：</view>
									<view class="image-list">
										<view v-for="(pic, picIndex) in item.proofPics.slice(0, 5)" :key="picIndex" class="cert-image" @click.stop="previewImage(fixImagePath(pic), item.proofPics.map(p => fixImagePath(p)))">
											<image :src="fixImagePath(pic)" mode="aspectFill" @error="onImageError(item, picIndex)" @load="onImageLoad(item, picIndex)"></image>
										</view>
										<view class="more-images" v-if="item.proofPics.length > 5">
											+{{item.proofPics.length - 5}}张
										</view>
									</view>
								</view>
								
								<view class="i-action">
									<view class="action-btn cancel" v-if="item.status === 0" @click.stop="cancelAfterSale(item)">取消申请</view>
									<view class="action-btn">查看详情</view>
								</view>
							</view>
						</view>
						
						<!-- 上拉加载更多 -->
						<view class="loading-more" v-if="tabItem.afterSaleList.length > 0">
							<view v-if="tabItem.loadingType === 'loading'" class="loading-spinner"></view>
							<text class="loading-text">
								{{tabItem.loadingType === 'more' ? '上拉加载更多' : 
								  (tabItem.loadingType === 'loading' ? '正在加载...' : '没有更多数据了')}}
							</text>
						</view>
					</view>
				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	import empty from "@/components/empty";
	import {
		formatDate
	} from '@/utils/date';
	import {
		fetchAfterSaleList,
		cancelAfterSale
	} from '@/api/afterSale.js';
	import {
		API_BASE_URL
	} from '@/utils/appConfig.js';

	export default {
		components: {
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				afterSaleParam: {
					status: -1,
					pageNum: 1,
					pageSize: 5
				},
				afterSaleList: [],
				loadingType: 'more',
				navList: [{
						state: -1,
						text: '全部',
						loadingType: 'more',
						afterSaleList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 0,
						text: '待处理',
						loadingType: 'more',
						afterSaleList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 1,
						text: '处理中',
						loadingType: 'more',
						afterSaleList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 2,
						text: '已完成',
						loadingType: 'more',
						afterSaleList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 3,
						text: '已拒绝',
						loadingType: 'more',
						afterSaleList: [],
						pageNum: 1,
						refreshing: false
					}
				],
				isDebug: false, // 调试模式标志
				imageErrors: {}, // 记录图片加载错误
				imageLoading: {}, // 记录图片加载状态
				debugInfo: {}, // 存储调试信息
				loadMoreText: {
					contentdown: "上拉加载更多",
					contentrefresh: "正在加载...",
					contentnomore: "没有更多数据了"
				}
			};
		},
		onLoad(options) {
			// 设置页面标题
			uni.setNavigationBarTitle({
				title: '售后服务'
			});
			
			// 如果有传入状态参数，则切换到对应选项卡
			if(options.state !== undefined) {
				const stateInt = parseInt(options.state, 10);
				// 找到对应的索引
				const index = this.navList.findIndex(item => item.state === stateInt);
				if (index !== -1) {
					this.tabCurrentIndex = index;
				}
			}
			
			// 显示加载中提示
			uni.showLoading({
				title: '加载中'
			});
			
			// 初始化加载数据
			this.loadData(true, false)
				.then(() => {
					uni.hideLoading();
				})
				.catch(() => {
					uni.hideLoading();
					// 显示错误提示
					uni.showToast({
						title: '加载失败，请下拉刷新重试',
						icon: 'none'
					});
				});
		},
		filters: {
			formatStatus(status) {
				let statusTip = '';
				switch (+status) {
					case 0:
						statusTip = '待处理';
						break;
					case 1:
						statusTip = '处理中';
						break;
					case 2:
						statusTip = '已完成';
						break;
					case 3:
						statusTip = '已拒绝';
						break;
				}
				return statusTip;
			},
			formatDateTime(time) {
				if (time == null || time === '') {
					return 'N/A';
				}
				let date = new Date(time);
				return formatDate(date, 'yyyy-MM-dd hh:mm:ss')
			},
		},
		methods: {
			// 格式化商品属性
			formatProductAttr(jsonAttr) {
				if (!jsonAttr) return '';
				
				try {
					let attrArr = JSON.parse(jsonAttr);
					let attrStr = '';
					for (let attr of attrArr) {
						attrStr += attr.key;
						attrStr += ":";
						attrStr += attr.value;
						attrStr += "; ";
					}
					return attrStr;
				} catch (e) {
					console.error('解析商品属性出错:', e);
					return jsonAttr; // 如果解析失败，返回原始字符串
				}
			},
			// 检查是否有凭证图片
			hasPics(item) {
				return item.pics && (
					(typeof item.pics === 'string' && item.pics.trim() !== '') ||
					(Array.isArray(item.pics) && item.pics.length > 0) ||
					(typeof item.pics === 'object' && item.pics !== null)
				);
			},
			
			// 检查图片是否正在加载
			isImageLoading(item, index) {
				if (!item || !item.id) return false;
				if (!this.imageLoading[item.id]) {
					this.$set(this.imageLoading, item.id, {});
					this.$set(this.imageLoading[item.id], index, true);
					return true;
				}
				return !!this.imageLoading[item.id][index];
			},
			
			// 图片加载错误处理
			onImageError(item, index) {
				if (!item) return;
				
				const itemId = item.id || (item.productId ? 'product_' + item.productId : 'unknown');
				console.error('图片加载失败:', itemId, index);
				
				// 记录错误状态便于UI处理
				if (!this.imageErrors[itemId]) {
					this.$set(this.imageErrors, itemId, {});
				}
				this.$set(this.imageErrors[itemId], index, true);
				
				// 设置加载状态为完成
				if (this.imageLoading[itemId]) {
					this.$set(this.imageLoading[itemId], index, false);
				}
			},
			
			// 图片加载完成处理
			onImageLoad(item, index) {
				if (!item) return;
				
				const itemId = item.id || (item.productId ? 'product_' + item.productId : 'unknown');
				
				if (!this.imageLoading[itemId]) {
					this.$set(this.imageLoading, itemId, {});
				}
				this.$set(this.imageLoading[itemId], index, false);
			},
			
			// 获取基础URL
			getBaseUrl() {
				// 使用全局配置的API基础URL作为图片服务器地址
				// 这样可以确保图片URL与API地址一致，避免硬编码
				return API_BASE_URL;
			},
			
			// 格式化并修复图片路径
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
						result = `${this.getBaseUrl()}/pics/20250410/${fileName}`;
					} else {
						// 可能是其他目录下的20250410格式图片
						result = path.startsWith('/') ? this.getBaseUrl() + path : this.getBaseUrl() + '/' + path;
					}
				}
				// 处理以pics/开头的特殊路径
				else if (path.includes('pics/') && !path.startsWith('/')) {
					result = `${this.getBaseUrl()}/pics/${path.split('pics/')[1]}`;
				}
				// 处理以/pics/开头的特殊路径
				else if (path.startsWith('/pics/')) {
					result = this.getBaseUrl() + path;
				}
				// 相对路径，添加基础URL
				else if (path.startsWith('/')) {
					result = this.getBaseUrl() + path;
				}
				// 其他情况，假设是相对路径
				else {
					result = this.getBaseUrl() + '/' + path;
				}
				
				// 输出图片路径转换结果
				console.log(`图片路径处理结果: ${result}`);
				return result;
			},
			
			// 格式化凭证图片列表
			formatPics(picsStr) {
				if (!picsStr) return [];
				
				// 调试输出原始数据
				if (this.isDebug) {
					console.log('原始凭证图片数据:', picsStr, '类型:', typeof picsStr);
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
								
							if (this.isDebug) {
								console.log('处理后的图片URL列表:', urls);
							}
							
							return urls;
						}
						
						// 如果是单个URL
						if (picsStr.includes('/upload/') || picsStr.startsWith('/')) {
							const url = this.fixImagePath(picsStr);
							if (this.isDebug) {
								console.log('处理后的单个URL:', url);
							}
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
			
			// 预览图片
			previewImage(current, urls) {
				uni.previewImage({
					current: current,
					urls: urls,
					indicator: 'number',
					loop: true
				});
			},
			// 切换原因展开/收起状态
			toggleReasonExpand(item) {
				// 使用Vue.set确保响应式更新
				if(typeof item.isReasonExpanded === 'undefined') {
					this.$set(item, 'isReasonExpanded', true);
				} else {
					item.isReasonExpanded = !item.isReasonExpanded;
				}
			},
			// 获取订单编号，考虑各种可能的数据结构
			getOrderSn(item) {
				if (item.orderSn) {
					return item.orderSn;
				} else if (item.order && item.order.orderSn) {
					return item.order.orderSn;
				} else if (item.orderId) {
					return '订单编号: ' + item.orderId;
				} else if (item.order && item.order.id) {
					return '订单编号: ' + item.order.id;
				} else {
					return '无订单信息';
				}
			},
			
			//加载数据
			loadData(isRefresh = false, showLoading = false) {
				// 当前选中的选项卡
				const currentTab = this.navList[this.tabCurrentIndex];
				
				// 如果是刷新操作，重置页码
				if (isRefresh) {
					currentTab.pageNum = 1;
				} else {
					// 否则页码加1
					currentTab.pageNum++;
				}
				
				// 已经在加载中，则不重复请求
				if (currentTab.loadingType === 'loading') {
					return Promise.reject(new Error('已经在加载中'));
				}
				
				// 显示加载提示
				if (showLoading) {
					uni.showLoading({
						title: '加载中'
					});
				}
				
				// 更新加载状态
				currentTab.loadingType = 'loading';
				
				// 构建请求参数
				const params = {
					pageNum: currentTab.pageNum,
					pageSize: this.afterSaleParam.pageSize
				};
				
				// 只有当状态不是全部时才添加状态过滤
				if (currentTab.state !== -1) {
					params.status = currentTab.state;
				}
				
				console.log('请求售后列表参数:', JSON.stringify(params));
				
				// 发起请求并返回Promise
				return new Promise((resolve, reject) => {
					fetchAfterSaleList(params)
						.then(response => {
							// 请求完成后关闭loading
							if (showLoading) {
								uni.hideLoading();
							}
							
							console.log('售后列表响应:', JSON.stringify(response));
							
							// 处理响应数据
							if (response.code === 200 && response.data) {
								const list = response.data.list || [];
								
								// 打印售后列表数据结构
								if (list.length > 0) {
									console.log('售后列表第一项数据结构:', JSON.stringify(list[0]));
								} else {
									console.log('售后列表为空');
								}
								
								// 如果是刷新操作，替换现有数据
								if (isRefresh) {
									currentTab.afterSaleList = list;
								} else {
									// 追加数据
									if (list.length > 0) {
										currentTab.afterSaleList = currentTab.afterSaleList.concat(list);
									}
								}
								
								// 根据返回数据量判断是否还有更多数据
								if (list.length < this.afterSaleParam.pageSize) {
									currentTab.loadingType = 'noMore';
								} else {
									currentTab.loadingType = 'more';
								}
								
								resolve(list);
							} else {
								// 请求失败
								currentTab.loadingType = 'more';
								
								if (isRefresh) {
									// 刷新时如果失败，清空数据
									currentTab.afterSaleList = [];
								}
								
								// 提示用户
								uni.showToast({
									title: response.message || '获取售后列表失败',
									icon: 'none'
								});
								
								reject(new Error(response.message || '获取售后列表失败'));
							}
						})
						.catch(error => {
							// 请求完成后关闭loading
							if (showLoading) {
								uni.hideLoading();
							}
							
							console.error('获取售后列表失败:', error);
							currentTab.loadingType = 'more';
							
							if (isRefresh) {
								// 刷新时如果失败，清空数据
								currentTab.afterSaleList = [];
							}
							
							// 提示用户
							uni.showToast({
								title: '获取售后列表失败',
								icon: 'none'
							});
							
							reject(error);
						});
				});
			},
			
			// 下拉刷新
			refreshData(tabIndex) {
				console.log('下拉刷新选项卡', tabIndex);
				
				// 设置刷新状态
				this.navList[tabIndex].refreshing = true;
				
				// 切换到当前选项卡
				this.tabCurrentIndex = tabIndex;
				
				// 重置当前选项卡数据
				const currentTab = this.navList[tabIndex];
				currentTab.pageNum = 1;
				currentTab.afterSaleList = [];
				currentTab.loadingType = 'loading';
				
				// 加载数据
				this.loadData(true)
					.then(() => {
						// 延迟关闭刷新状态
						setTimeout(() => {
							this.navList[tabIndex].refreshing = false;
						}, 300);
					})
					.catch(() => {
						// 延迟关闭刷新状态（即使出错）
						setTimeout(() => {
							this.navList[tabIndex].refreshing = false;
						}, 300);
					});
			},
			
			// 滚动到底部加载更多
			onScrolltolower() {
				console.log('滚动到底部，加载更多数据');
				const currentTab = this.navList[this.tabCurrentIndex];
				
				// 如果不是加载中且不是没有更多数据，则加载更多
				if (currentTab.loadingType !== 'loading' && currentTab.loadingType !== 'noMore') {
					this.loadData();
				}
			},
			
			// 刷新当前标签页
			refreshCurrentTab() {
				console.log('刷新当前选项卡', this.tabCurrentIndex);
				
				// 显示loading提示
				uni.showLoading({
					title: '刷新中...'
				});
				
				// 重置当前选项卡数据
				const currentTab = this.navList[this.tabCurrentIndex];
				currentTab.pageNum = 1;
				currentTab.afterSaleList = [];
				currentTab.loadingType = 'loading';
				
				// 加载数据
				this.loadData(true, false)
					.then(() => {
						// 延迟关闭loading
						setTimeout(() => {
							uni.hideLoading();
							uni.showToast({
								title: '刷新成功',
								icon: 'none',
								duration: 1000
							});
						}, 500);
					})
					.catch(() => {
						// 延迟关闭loading（即使出错）
						setTimeout(() => {
							uni.hideLoading();
							uni.showToast({
								title: '刷新失败',
								icon: 'none',
								duration: 1000
							});
						}, 500);
					});
			},
			
			//swiper 切换
			changeTab(e) {
				const newTabIndex = e.target.current;
				console.log(`标签页从 ${this.tabCurrentIndex} 切换到 ${newTabIndex}`);
				this.tabCurrentIndex = newTabIndex;
				
				const currentTab = this.navList[this.tabCurrentIndex];
				
				// 如果当前选项卡没有数据且不在加载中，则加载数据
				if (currentTab.afterSaleList.length === 0 && currentTab.loadingType !== 'loading') {
					this.loadData(true, true);
				}
			},
			
			//顶部tab点击
			tabClick(index) {
				if (this.tabCurrentIndex === index) {
					// 如果点击当前选项卡，则刷新
					this.refreshCurrentTab();
				} else {
					// 否则切换选项卡
					this.tabCurrentIndex = index;
					
					const currentTab = this.navList[this.tabCurrentIndex];
					
					// 如果当前选项卡没有数据，则加载数据
					if (currentTab.afterSaleList.length === 0) {
						this.loadData(true, true);
					}
				}
			},
			//计算商品总数量
			calcTotalQuantity(item) {
				if (!item.orderItemList || item.orderItemList.length === 0) {
					return item.returnCount || 0;
				}
				
				return item.orderItemList.reduce((total, product) => {
					return total + (parseInt(product.returnQuantity || product.productQuantity || 0));
				}, 0);
			},
			//查看售后详情
			showAfterSaleDetail(id) {
				uni.navigateTo({
					url: `/pages/afterSale/afterSaleDetail?id=${id}`
				});
			},
			//申请售后
			applyAfterSale(order) {
				uni.navigateTo({
					url: `/pages/afterSale/applyAfterSale?orderId=${order.id}`
				});
			},
			// 检查图片是否加载错误
			hasImageError(item, index) {
				if (!item || !item.id || !this.imageErrors[item.id]) return false;
				return !!this.imageErrors[item.id][index];
			},
			// 查看售后详情
			viewAfterSaleDetail(id) {
				uni.navigateTo({
					url: `/pages/afterSale/afterSaleDetail?id=${id}`
				});
			},
			// 查看详情
			viewDetail(item) {
				// 跳转到售后详情页面
				uni.navigateTo({
					url: '/pages/afterSale/afterSaleDetail?id=' + item.id
				});
			},
			// 取消售后申请
			cancelAfterSale(item) {
				uni.showModal({
					title: '提示',
					content: '确定要取消该售后申请吗？',
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({
								title: '处理中...'
							});
							
							cancelAfterSale(item.id).then(response => {
								uni.hideLoading();
								if (response.code === 200) {
									uni.showToast({
										title: '取消成功',
										icon: 'success'
									});
									// 刷新当前页
									this.refreshCurrentTab();
								} else {
									uni.showToast({
										title: response.message || '取消失败',
										icon: 'none'
									});
								}
							}).catch(error => {
								uni.hideLoading();
								uni.showToast({
									title: '取消失败',
									icon: 'none'
								});
								console.error('取消售后申请失败:', error);
							});
						}
					}
				});
			},
			// 获取状态文本
			getStatusText(status) {
				const statusMap = {
					0: '待处理',
					1: '处理中',
					2: '已完成',
					3: '已拒绝'
				};
				return statusMap[status] || '未知状态';
			},
			// 格式化日期
			formatDate(dateStr) {
				if (!dateStr) return 'N/A';
				const date = new Date(dateStr);
				return formatDate(date, 'yyyy-MM-dd hh:mm:ss');
			},
			// 查看详情
			viewDetails(item) {
				// 跳转到售后详情页面
				uni.navigateTo({
					url: '/pages/afterSale/afterSaleDetail?id=' + item.id
				});
			},
			// 检查是否有凭证图片
			hasProofPics(item) {
				return item.proofPics && (
					(typeof item.proofPics === 'string' && item.proofPics.trim() !== '') ||
					(Array.isArray(item.proofPics) && item.proofPics.length > 0) ||
					(typeof item.proofPics === 'object' && item.proofPics !== null)
				);
			},
			// 获取凭证图片列表
			getAfterSaleProofPics(item) {
				if (!item.proofPics) return [];
				
				// 如果是字符串或数组，直接返回
				if (typeof item.proofPics === 'string' || Array.isArray(item.proofPics)) {
					return this.formatPics(item.proofPics);
				}
				
				// 如果是对象，遍历所有可能的键
				const pics = [];
				for (const key in item) {
					if (key.startsWith('proofPics') && typeof item[key] === 'string') {
						pics.push(item[key]);
					}
				}
				return this.formatPics(pics.join(','));
			},
			// 计算商品总退款金额
			calcTotalAmount(item) {
				if (!item.afterSaleItemList || item.afterSaleItemList.length === 0) {
					return item.returnAmount || 0;
				}
				
				return item.afterSaleItemList.reduce((total, product) => {
					// 退款金额 = 单价 × 退货数量
					const price = parseFloat(product.productPrice || 0);
					const quantity = parseInt(product.returnQuantity || 0);
					return total + (price * quantity);
				}, 0).toFixed(2);
			},
			// 获取产品凭证图片
			getProductProofPics(product) {
				if (!product.proofPics) return [];
				
				// 已经是数组
				if (Array.isArray(product.proofPics)) {
					return product.proofPics.filter(pic => pic && typeof pic === 'string')
						.map(pic => this.fixImagePath(pic));
				}
				
				// 字符串情况
				if (typeof product.proofPics === 'string') {
					// 如果是URL字符串而不是JSON，直接作为单个URL处理
					if (product.proofPics.startsWith('http') || product.proofPics.startsWith('/')) {
						return [this.fixImagePath(product.proofPics)];
					}
					
					// 如果包含逗号，可能是逗号分隔的多个URL
					if (product.proofPics.includes(',')) {
						return product.proofPics.split(',')
							.filter(pic => pic && pic.trim())
							.map(pic => this.fixImagePath(pic.trim()));
					}
					
					// 尝试解析JSON字符串
					try {
						if (product.proofPics.startsWith('[') || product.proofPics.startsWith('{')) {
							const pics = JSON.parse(product.proofPics);
							if (Array.isArray(pics)) {
								return pics.filter(pic => pic && typeof pic === 'string')
									.map(pic => this.fixImagePath(pic));
							}
						}
					} catch (e) {
						console.log('不是有效的JSON格式，作为单个URL处理:', product.proofPics);
					}
					
					// 默认作为单个URL处理
					return [this.fixImagePath(product.proofPics)];
				}
				
				return [];
			},
			
			// 限制凭证图片数量
			getLimitedProductProofPics(product) {
				const pics = this.getProductProofPics(product);
				return pics.slice(0, 5); // 最多显示5张图片
			},
		}
	}
</script>

<style lang="scss" scoped>
	.content {
		background-color: #f8f8f8;
		min-height: 100vh;
	}
	
	.navbar {
		display: flex;
		height: 80rpx;
		padding: 0 5px;
		background: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
		position: relative;
		z-index: 10;
		
		.nav-item {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 28rpx;
			color: #303133;
			position: relative;
			
			&.current {
				color: #3366cc;
				
				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44rpx;
					height: 4rpx;
					background: linear-gradient(to right, #2255aa, #3366cc);
				}
			}
		}
		
		.refresh-btn {
			padding: 0 20rpx;
			font-size: 28rpx;
			color: #909399;
		}
	}
	
	/* swiper相关样式 */
	.swiper-box {
		height: calc(100vh - 80rpx);
	}
	
	.tab-content {
		height: 100%;
	}
	
	.list-scroll-content {
		height: 100%;
		box-sizing: border-box;
	}
	
	/* 售后列表区域 */
	.after-sale-list {
		padding: 20rpx;
	}
	
	/* 售后服务项目 */
	.after-sale-item {
		margin-bottom: 20rpx;
		border-radius: 12rpx;
		background: #fff;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
		
		.i-top {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx;
			border-bottom: 1rpx solid #eee;
			
			.service-id {
				font-size: 26rpx;
				color: #333;
			}
			
			.state {
				font-size: 24rpx;
				padding: 4rpx 12rpx;
				border-radius: 20rpx;
				
				&.status-0 {
					color: #ff9500;
					background: rgba(255, 149, 0, 0.1);
				}
				
				&.status-1 {
					color: #007aff;
					background: rgba(0, 122, 255, 0.1);
				}
				
				&.status-2 {
					color: #4cd964;
					background: rgba(76, 217, 100, 0.1);
				}
				
				&.status-3 {
					color: #ff3b30;
					background: rgba(255, 59, 48, 0.1);
				}
			}
		}
		
		.order-num {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16rpx 20rpx;
			font-size: 26rpx;
			color: #666;
			border-bottom: 1rpx solid #f5f5f5;
			
			.create-time {
				color: #999;
				font-size: 24rpx;
			}
		}
		
		.i-content {
			padding: 20rpx;
			
			.product-list {
				margin-bottom: 20rpx;
				
				.product-item {
					display: flex;
					margin-bottom: 16rpx;
					padding: 16rpx;
					background: #f8f8f8;
					border-radius: 8rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.product-img {
						width: 120rpx;
						height: 120rpx;
						border-radius: 8rpx;
						background: #fff;
						border: 1rpx solid #eee;
					}
					
					.product-info {
						flex: 1;
						margin-left: 20rpx;
						overflow: hidden;
						
						.product-name {
							font-size: 28rpx;
							color: #333;
							margin-bottom: 8rpx;
							line-height: 1.3;
							display: -webkit-box;
							-webkit-box-orient: vertical;
							-webkit-line-clamp: 2;
							overflow: hidden;
						}
						
						.product-attr {
							font-size: 24rpx;
							color: #999;
							margin-bottom: 8rpx;
						}
						
						.product-price-qty {
							display: flex;
							justify-content: space-between;
							font-size: 26rpx;
							color: #3366cc;
							margin-bottom: 8rpx;
						}
						
						.product-reason {
							font-size: 24rpx;
							color: #999;
							background: rgba(0, 0, 0, 0.03);
							padding: 8rpx 12rpx;
							border-radius: 4rpx;
						}
						
						// 商品项的凭证图片
						.proof-images {
							margin-top: 8rpx;
							.image-label {
								font-size: 26rpx;
								color: #666;
								margin-bottom: 12rpx;
							}
							.image-list {
								display: flex;
								.proof-image {
									width: 160rpx;
									height: 160rpx;
									margin-right: 16rpx;
									border-radius: 8rpx;
									overflow: hidden;
									box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
									image {
										width: 100%;
										height: 100%;
										object-fit: cover;
									}
								}
							}
							.more-images {
								font-size: 24rpx;
								color: #999;
								margin-left: 16rpx;
							}
						}
					}
				}
			}
			
			.i-info {
				margin: 16rpx 0;
				padding: 16rpx;
				background: #f8f8f8;
				border-radius: 8rpx;
				border-bottom: 1rpx solid #eee;
				
				.info-item {
					justify-content: space-between;
					align-items: center;
					margin-bottom: 12rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.title {
						font-size: 26rpx;
						color: #666;
					}
					
					.content {
						font-size: 26rpx;
						color: #333;
					}
					
					.price {
						font-size: 28rpx;
						color: #ff3b30;
						font-weight: 500;
					}
				}
			}
			
			.certificate-images {
				margin-top: 16rpx;
				
				.certificate-title {
					font-size: 26rpx;
					color: #666;
					margin-bottom: 12rpx;
				}
				
				.image-list {
					display: flex;
					
					.cert-image {
						width: 160rpx;
						height: 160rpx;
						margin-right: 16rpx;
						border-radius: 8rpx;
						overflow: hidden;
						box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
						
						image {
							width: 100%;
							height: 100%;
							object-fit: cover;
						}
					}
				}
				
				.more-images {
					font-size: 24rpx;
					color: #999;
					margin-left: 16rpx;
				}
			}
			
			.i-action {
				display: flex;
				justify-content: flex-end;
				margin-top: 20rpx;
				padding-top: 16rpx;
				border-top: 1rpx solid #f5f5f5;
				
				.action-btn {
					display: inline-block;
					padding: 12rpx 30rpx;
					font-size: 26rpx;
					color: #3366cc;
					border: 1rpx solid #3366cc;
					border-radius: 30rpx;
					background: #fff;
					
					&.cancel {
						color: #999;
						border: 1rpx solid #ddd;
						margin-right: 16rpx;
					}
				}
			}
		}
	}
	
	/* 加载状态 */
	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 300rpx;
		
		.loading-spinner {
			width: 60rpx;
			height: 60rpx;
			border: 4rpx solid rgba(243, 243, 243, 0.8);
			border-top: 4rpx solid #3366cc;
			border-radius: 50%;
			animation: spin 1.2s cubic-bezier(0.5, 0.1, 0.5, 1) infinite;
			box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.05);
		}
		
		.loading-text {
			font-size: 28rpx;
			color: #999;
			margin-top: 20rpx;
			letter-spacing: 2rpx;
		}
	}
	
	/* 空状态 */
	.empty-box {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 100rpx 0;
		width: 100%;
		
		.empty-icon {
			width: 200rpx;
			height: 200rpx;
			margin-bottom: 20rpx;
		}
		
		.empty-text {
			font-size: 28rpx;
			color: #999;
			text-align: center;
			line-height: 1.5;
			letter-spacing: 1rpx;
		}
		
		.retry-btn {
			margin-top: 30rpx;
			padding: 10rpx 40rpx;
			background-color: #f8f8f8;
			color: #666;
			font-size: 24rpx;
			border-radius: 30rpx;
			box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
			transition: all 0.2s ease;
			
			&:active {
				background-color: #e8e8e8;
				transform: scale(0.98);
			}
		}
	}
	
	/* 底部加载更多 */
	.loading-more {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 80rpx;
		padding: 20rpx 0;
		
		.loading-spinner {
			width: 36rpx;
			height: 36rpx;
			margin-right: 20rpx;
			border: 3rpx solid #f3f3f3;
			border-top: 3rpx solid #3366cc;
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}
		
		.loading-text {
			font-size: 28rpx;
			color: #999;
		}
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		50% { transform: rotate(180deg); }
		100% { transform: rotate(360deg); }
	}
</style> 
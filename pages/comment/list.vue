<template>
	<view class="content">
		<!-- 评价概要 -->
		<view class="summary-section">
			<text class="total">共 {{ commentSummary.totalCount }} 条评价</text>
			<text class="rate">好评率: {{ commentSummary.positiveRate }}%</text>
		</view>

		<!-- 评价列表 -->
		<view class="list-section" v-if="commentList.length > 0">
			<view class="eva-box b-b" v-for="(comment, index) in commentList" :key="index">
				<image class="portrait" :src="comment.memberIcon || '/static/missing-face.png'" mode="aspectFill"></image>
				<view class="right">
					<text class="name">{{ comment.memberNickName }}</text>
					<view class="star-line">
						<text class="yticon icon-xingxing" v-for="n in 5" :key="n" :class="{ active: n <= comment.star }"></text>
					</view>
					<text class="con">{{ comment.content }}</text>
					<view class="pic-list" v-if="comment.pics">
						<image v-for="(pic, picIndex) in formatCommentPics(comment.pics)" :key="picIndex" 
							   :src="pic" mode="aspectFill" class="pic-item" @click="previewCommentImage(comment, picIndex)"></image>
					</view>
					<view class="bot">
						<text class="attr">{{ comment.productAttribute | formatProductAttr }}</text>
						<text class="time">{{ comment.createTime | formatDateTime }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空白页 -->
		<empty v-else-if="loadingType !== 'loading'"></empty>

		<!-- 加载更多 -->
		<uni-load-more :status="loadingType"></uni-load-more>

	</view>
</template>

<script>
	import { fetchCommentList, fetchCommentSummary } from '@/api/comment.js';
	import { formatDate } from '@/utils/date';
	import empty from "@/components/empty";
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';

	export default {
		components: {
			empty,
			uniLoadMore
		},
		data() {
			return {
				productId: null,
				commentSummary: {
					totalCount: 0,
					positiveRate: 0
				},
				commentList: [],
				pageNum: 1,
				pageSize: 10, // 每页加载数量
				loadingType: 'loading' // more, loading, noMore
			};
		},
		async onLoad(options) {
			if (!options.productId) {
				uni.showToast({ title: '缺少商品信息', icon: 'none' });
				uni.navigateBack();
				return;
			}
			this.productId = options.productId;
			await this.loadSummary();
			await this.loadData();
		},
		// 上拉加载更多
		onReachBottom() {
			if (this.loadingType === 'more') {
				this.pageNum++;
				this.loadData('add');
			}
		},
		filters: {
			formatDateTime(time) {
				if (time == null || time === '') {
					return 'N/A';
				}
				let date = new Date(time);
				return formatDate(date, 'yyyy-MM-dd hh:mm:ss');
			},
			formatProductAttr(jsonAttr) {
				if (!jsonAttr) return '';
				try {
					let attrArr = JSON.parse(jsonAttr);
					let attrStr = '';
					for (let attr of attrArr) {
						attrStr += attr.key + ":" + attr.value + "; ";
					}
					// 移除末尾的分号和空格
					return attrStr.replace(/;\s*$/, '');
				} catch (e) {
					// 如果解析失败，直接返回原始字符串或者空字符串
					console.error("解析商品属性JSON失败:", jsonAttr, e);
					return jsonAttr; // 或者返回 ''
				}
			},
		},
		methods: {
			// 加载评价概要
			async loadSummary() {
				try {
					const res = await fetchCommentSummary(this.productId);
					if (res.code === 200) {
						this.commentSummary = res.data;
					} else {
						console.warn('加载评价概要失败:', res.message);
					}
				} catch (error) {
					console.error('加载评价概要异常:', error);
				}
			},
			// 加载评价列表数据
			async loadData(type = 'refresh') {
				if (this.loadingType === 'loading' && type === 'add') return;
				if (type === 'refresh') {
					this.pageNum = 1;
					this.commentList = [];
				}
				this.loadingType = 'loading';

				try {
					const res = await fetchCommentList(this.productId, {
						pageNum: this.pageNum,
						pageSize: this.pageSize
					});

					if (res.code === 200) {
						const data = res.data;
						if (data.list && data.list.length > 0) {
							this.commentList = this.commentList.concat(data.list);
							if (data.list.length < this.pageSize || this.pageNum * this.pageSize >= data.total) {
								this.loadingType = 'noMore';
							} else {
								this.loadingType = 'more';
							}
						} else {
							this.loadingType = 'noMore';
						}
					} else {
						console.warn('加载评价列表失败:', res.message);
						this.loadingType = 'more'; // 允许重试
					}
				} catch (error) {
					console.error('加载评价列表异常:', error);
					this.loadingType = 'more'; // 允许重试
				} finally {
					if (type === 'refresh') {
						uni.stopPullDownRefresh();
					}
				}
			},
			// 格式化评价图片
			formatCommentPics(pics) {
				if (!pics) return [];
				return pics.split(',');
			},
			// 预览评价图片
			previewCommentImage(comment, index) {
				const urls = this.formatCommentPics(comment.pics);
				uni.previewImage({
					urls: urls,
					current: urls[index]
				});
			}
		}
	};
</script>

<style lang="scss">
	page {
		background: $page-color-base;
	}

	.content {
		padding-bottom: 20upx;
	}

	.summary-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20upx 30upx;
		background-color: #fff;
		margin-bottom: 16upx;
		font-size: $font-sm;
		color: $font-color-light;

		.total {
			color: $font-color-dark;
		}

		.rate {
			color: $base-color;
		}
	}

	.list-section {
		background-color: #fff;
	}

	.eva-box {
		display: flex;
		padding: 20upx 30upx;

		.portrait {
			flex-shrink: 0;
			width: 80upx;
			height: 80upx;
			border-radius: 100px;
			margin-right: 26upx;
		}

		.right {
			flex: 1;
			display: flex;
			flex-direction: column;
			font-size: $font-base;
			color: $font-color-base;

			.name {
				color: $font-color-dark;
				margin-bottom: 10upx;
			}

			.star-line {
				margin-bottom: 10upx;
				.yticon {
					font-size: 30upx;
					color: $font-color-light;
					margin-right: 6upx;
					&.active {
						color: #ffb400;
					}
				}
			}

			.con {
				font-size: $font-base;
				color: $font-color-dark;
				padding: 10upx 0;
			}

			.pic-list {
				display: flex;
				flex-wrap: wrap;
				margin-top: 16upx;
				.pic-item {
					width: 100upx;
					height: 100upx;
					margin-right: 10upx;
					margin-bottom: 10upx;
					border-radius: 6upx;
				}
			}

			.bot {
				display: flex;
				justify-content: space-between;
				font-size: $font-sm;
				color: $font-color-light;
				margin-top: 10upx;
			}
		}
	}

</style> 
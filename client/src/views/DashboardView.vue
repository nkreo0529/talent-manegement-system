<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuth } from '@/composables/useAuth';
import AppLayout from '@/components/layout/AppLayout.vue';

const appStore = useAppStore();
const { employee } = useAuth();

onMounted(() => {
	appStore.setPageTitle('ダッシュボード');
	appStore.setBreadcrumbs([]);
});

type ColorKey = 'primary' | 'accent' | 'blue' | 'purple';

// Demo stats
const stats = ref<
	Array<{ label: string; value: number; icon: string; color: ColorKey; to: string }>
>([
	{ label: '総社員数', value: 40, icon: 'people', color: 'primary', to: '/employees' },
	{ label: 'チーム数', value: 5, icon: 'groups', color: 'accent', to: '/teams' },
	{ label: '今月の1on1', value: 12, icon: 'event', color: 'blue', to: '/admin/evaluations' },
	{ label: 'AI分析済み', value: 35, icon: 'smart_toy', color: 'purple', to: '/ai-consultation' },
]);

const colorClasses: Record<ColorKey, { bg: string; text: string; icon: string }> = {
	primary: {
		bg: 'bg-primary-50 dark:bg-primary-900/20',
		text: 'text-primary-600 dark:text-primary-400',
		icon: 'bg-primary-100 dark:bg-primary-900/30',
	},
	accent: {
		bg: 'bg-green-50 dark:bg-green-900/20',
		text: 'text-green-600 dark:text-green-400',
		icon: 'bg-green-100 dark:bg-green-900/30',
	},
	blue: {
		bg: 'bg-blue-50 dark:bg-blue-900/20',
		text: 'text-blue-600 dark:text-blue-400',
		icon: 'bg-blue-100 dark:bg-blue-900/30',
	},
	purple: {
		bg: 'bg-purple-50 dark:bg-purple-900/20',
		text: 'text-purple-600 dark:text-purple-400',
		icon: 'bg-purple-100 dark:bg-purple-900/30',
	},
};

// Quick actions
const quickActions = [
	{ label: '社員を検索', icon: 'search', to: '/employees' },
	{ label: 'SF分析を見る', icon: 'bar_chart', to: '/analysis/strengths' },
	{ label: 'AI相談', icon: 'smart_toy', to: '/ai-consultation' },
	{ label: 'チーム管理', icon: 'settings', to: '/admin/teams' },
];

// Recent activities (demo data)
const recentActivities = ref([
	{
		type: 'profile_update',
		user: '田中太郎',
		message: 'プロフィールを更新しました',
		time: '10分前',
	},
	{
		type: 'ai_analysis',
		user: 'システム',
		message: '3名のAIプロフィールを生成しました',
		time: '1時間前',
	},
	{ type: 'team_change', user: '佐藤花子', message: '開発チームに異動しました', time: '2時間前' },
	{ type: 'evaluation', user: '鈴木一郎', message: '2024H1評価が完了しました', time: '昨日' },
]);

const activityIcons: Record<string, string> = {
	profile_update: 'person',
	ai_analysis: 'smart_toy',
	team_change: 'swap_horiz',
	evaluation: 'grade',
};
</script>

<template>
	<AppLayout>
		<div class="space-y-6">
			<!-- Welcome message -->
			<div class="card bg-gradient-to-r from-primary-600 to-primary-700 text-white border-none">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-2xl font-bold">
							おかえりなさい、{{ employee?.name || 'ユーザー' }}さん
						</h1>
						<p class="mt-1 text-primary-100">今日も素晴らしい一日を！</p>
					</div>
					<div class="hidden md:block">
						<span class="material-icons text-6xl text-white/40">waving_hand</span>
					</div>
				</div>
			</div>

			<!-- Stats grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<router-link
					v-for="stat in stats"
					:key="stat.label"
					:to="stat.to"
					class="card hover:shadow-card-hover transition-shadow cursor-pointer">
					<div class="flex items-center space-x-4">
						<div
							class="w-12 h-12 rounded-xl flex items-center justify-center"
							:class="colorClasses[stat.color].icon">
							<span class="material-icons text-2xl" :class="colorClasses[stat.color].text">
								{{ stat.icon }}
							</span>
						</div>
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
							<p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
						</div>
					</div>
				</router-link>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Quick actions -->
				<div class="lg:col-span-1">
					<div class="card">
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							クイックアクション
						</h2>
						<div class="space-y-2">
							<router-link
								v-for="action in quickActions"
								:key="action.label"
								:to="action.to"
								class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
								<span class="material-icons text-gray-500">{{ action.icon }}</span>
								<span class="text-gray-700 dark:text-gray-300">{{ action.label }}</span>
								<span class="material-icons text-gray-400 ml-auto text-sm">chevron_right</span>
							</router-link>
						</div>
					</div>
				</div>

				<!-- Recent activity -->
				<div class="lg:col-span-2">
					<div class="card">
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							最近のアクティビティ
						</h2>
						<div class="space-y-4">
							<div
								v-for="(activity, index) in recentActivities"
								:key="index"
								class="flex items-start space-x-3">
								<div
									class="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center shrink-0">
									<span class="material-icons text-gray-500 text-lg">
										{{ activityIcons[activity.type] }}
									</span>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm text-gray-900 dark:text-white">
										<span class="font-medium">{{ activity.user }}</span>
										が{{ activity.message }}
									</p>
									<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{{ activity.time }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- SF Overview (Placeholder) -->
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
						ストレングスファインダー概要
					</h2>
					<router-link
						to="/analysis/strengths"
						class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
						詳細を見る →
					</router-link>
				</div>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div
						v-for="(domain, key) in {
							executing: { name: '実行力', color: 'purple', count: 45 },
							influencing: { name: '影響力', color: 'amber', count: 32 },
							relationship: { name: '人間関係構築力', color: 'blue', count: 38 },
							strategic: { name: '戦略的思考力', color: 'green', count: 40 },
						}"
						:key="key"
						class="p-4 rounded-lg"
						:class="`bg-${domain.color}-50 dark:bg-${domain.color}-900/20`">
						<p class="text-sm text-gray-600 dark:text-gray-400">{{ domain.name }}</p>
						<p
							class="text-2xl font-bold mt-1"
							:class="`text-${domain.color}-600 dark:text-${domain.color}-400`">
							{{ domain.count }}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">TOP5に含まれる数</p>
					</div>
				</div>
			</div>
		</div>
	</AppLayout>
</template>

import type { ThemeConfig } from 'antd'

const antdTheme: ThemeConfig = {
  token: {
    fontSize: 16,
    colorText: 'rgb(161 161 170)',
  },
  components: {
    Progress: {
      remainingColor: 'rgb(161 161 170)',
      circleTextColor: 'rgb(161 161 170)',
    },
  },
}

export default antdTheme

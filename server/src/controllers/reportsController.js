const ReadingModel = require('../models/readingModel');
const { getTodayString } = require('../middleware/validate');

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]}`;
}

class ReportsController {
  static async getReports(req, res, next) {
    try {
      const selectedDate = (req.query.date || getTodayString()).trim();
      const patientId = req.query.patientId;

      // Doctor role bonus: can inspect patient reports
      let targetUserId = req.user.id;
      if (patientId && req.user.role === 'doctor') {
        targetUserId = parseInt(patientId, 10);
      }

      // Parse selected date
      const parts = selectedDate.split('-').map(Number);
      if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date parameter. Use YYYY-MM-DD format.',
        });
      }

      const [year, month, day] = parts;
      const pad = (n) => String(n).padStart(2, '0');

      // 1. Daily Report Range: the selected date
      const dailyDate = selectedDate;
      const dailyLabel = formatDateDisplay(dailyDate);

      // 2. Month-to-date (MTD) Range: 1st of the month to selected date
      const mtdStartDate = `${year}-${pad(month)}-01`;
      const mtdEndDate = selectedDate;
      const mtdLabel = `${formatDateShort(mtdStartDate)} – ${formatDateDisplay(mtdEndDate)}`;

      // 3. Monthly (Whole previous month) Range:
      let prevYear = year;
      let prevMonth = month - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
      const prevMonthStartDate = `${prevYear}-${pad(prevMonth)}-01`;
      const prevMonthEndDate = `${prevYear}-${pad(prevMonth)}-${pad(prevMonthLastDay)}`;
      const prevMonthLabel = `${formatDateShort(prevMonthStartDate)} – ${formatDateDisplay(prevMonthEndDate)}`;

      // Execute stats queries concurrently
      const [
        dailyStats,
        dailyReadings,
        mtdStats,
        prevMonthStats,
        mtdReadings,
      ] = await Promise.all([
        ReadingModel.getReportStats({
          userId: targetUserId,
          startDate: dailyDate,
          endDate: dailyDate,
        }),
        ReadingModel.getReadingsInRange({
          userId: targetUserId,
          startDate: dailyDate,
          endDate: dailyDate,
        }),
        ReadingModel.getReportStats({
          userId: targetUserId,
          startDate: mtdStartDate,
          endDate: mtdEndDate,
        }),
        ReadingModel.getReportStats({
          userId: targetUserId,
          startDate: prevMonthStartDate,
          endDate: prevMonthEndDate,
        }),
        ReadingModel.getReadingsInRange({
          userId: targetUserId,
          startDate: mtdStartDate,
          endDate: mtdEndDate,
        }),
      ]);

      res.status(200).json({
        success: true,
        selectedDate,
        reports: {
          daily: {
            title: 'Daily Report',
            dateRange: dailyLabel,
            startDate: dailyDate,
            endDate: dailyDate,
            count: dailyStats.count,
            highest: dailyStats.highest,
            lowest: dailyStats.lowest,
            average: dailyStats.average,
            hasData: dailyStats.count > 0,
            readings: dailyReadings,
          },
          monthToDate: {
            title: 'Month-to-date',
            dateRange: mtdLabel,
            startDate: mtdStartDate,
            endDate: mtdEndDate,
            count: mtdStats.count,
            highest: mtdStats.highest,
            lowest: mtdStats.lowest,
            average: mtdStats.average,
            hasData: mtdStats.count > 0,
          },
          monthly: {
            title: 'Monthly (Previous Month)',
            dateRange: prevMonthLabel,
            startDate: prevMonthStartDate,
            endDate: prevMonthEndDate,
            count: prevMonthStats.count,
            highest: prevMonthStats.highest,
            lowest: prevMonthStats.lowest,
            average: prevMonthStats.average,
            hasData: prevMonthStats.count > 0,
          },
        },
        chartData: mtdReadings,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportsController;

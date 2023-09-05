import { DKMH_API_URL } from '../configs/constant.js';

class DKMHController {
  constructor() {}

  getSemester = async (token) => {
    return fetch(`${DKMH_API_URL}/sch/w-locdshockytkbuser`, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        filter: {
          is_tieng_anh: null,
        },
        additional: {
          paging: {
            limit: 100,
            page: 1,
          },
          ordering: [
            {
              name: 'hoc_ky',
              order_type: 1,
            },
          ],
        },
      },
    })
      .then((response) => response.json())
      .then((response) => {
        const date = new Date();
        let semester = null;
        response.data.ds_hoc_ky.forEach((hoc_ky) => {
          let dateParts = hoc_ky.ngay_bat_dau_hk?.split('/');
          hoc_ky.ngay_bat_dau_hk = new Date(
            +dateParts[2],
            dateParts[1] - 1,
            +dateParts[0]
          );

          dateParts = hoc_ky.ngay_ket_thuc_hk?.split('/');
          hoc_ky.ngay_ket_thuc_hk = new Date(
            +dateParts[2],
            dateParts[1] - 1,
            +dateParts[0]
          );

          if (
            hoc_ky.ngay_bat_dau_hk <= date &&
            hoc_ky.ngay_ket_thuc_hk > date
          ) {
            semester = hoc_ky;
          }
        });

        return semester;
      })
      .catch((err) => console.log(err));
  };

  getSchedule = async (token, semester) => {
    return fetch(`${DKMH_API_URL}/sch/w-locdstkbtuanusertheohocky`, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          hoc_ky: semester,
          ten_hoc_ky: '',
        },
        additional: {
          paging: {
            limit: 100,
            page: 1,
          },
          ordering: [
            {
              name: null,
              order_type: null,
            },
          ],
        },
      }),
    })
      .then((response) => response.json())
      .then((response) => response.data)
      .catch((err) => console.log(err));
  };

  formatSchedule = async (schedule) => {
    const data = [];
    const date = new Date();

    schedule.ds_tuan_tkb.forEach((tuan) => {
      let dateParts = tuan.ngay_bat_dau?.split('/');
      tuan.ngay_bat_dau = new Date(
        +dateParts[2],
        dateParts[1] - 1,
        +dateParts[0]
      );

      dateParts = tuan.ngay_ket_thuc?.split('/');
      tuan.ngay_ket_thuc = new Date(
        +dateParts[2],
        dateParts[1] - 1,
        +dateParts[0]
      );

      if (tuan.ngay_ket_thuc >= date) {
        tuan.ds_thoi_khoa_bieu.forEach((mon) => {
          mon.ngay_hoc = new Date(mon.ngay_hoc);
          if (mon.ngay_hoc >= date) {
            const gio_bat_dau = schedule.ds_tiet_trong_ngay.find(
              (tiet) => tiet.tiet === mon.tiet_bat_dau
            ).gio_bat_dau;

            let startTime = gio_bat_dau.split(':');
            startTime =
              parseInt(startTime[0], 10) * 3600000 +
              parseInt(startTime[1], 10) * 60000;

            const ngay_hoc = new Date(mon.ngay_hoc);
            const delay =
              ngay_hoc.getTime() + startTime - Date.now() - 15 * 60000;

            if (delay > 0) {
              data.push({
                subject: mon.ten_mon,
                room: mon.ma_phong,
                time: gio_bat_dau,
                ngay_hoc,
                delay,
              });
            }
          }
        });
      }
    });

    return data;
  };

  getArticle = async () => {
    return fetch(`${DKMH_API_URL}/web/w-locdsbaiviet`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          is_hien_thi: true,
        },
        additional: {
          paging: {
            limit: 100,
            page: 1,
          },
          ordering: [
            {
              name: 'do_uu_tien',
              order_type: 1,
            },
            {
              name: 'ngay_dang_tin',
              order_type: 1,
            },
          ],
        },
      }),
    })
      .then((response) => response.json())
      .then((response) => response.data.ds_bai_viet)
      .catch((err) => console.log(err));
  };
}

const dkmhController = new DKMHController();
export default dkmhController;

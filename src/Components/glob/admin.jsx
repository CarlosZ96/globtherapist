/* eslint-disable import/no-useless-path-segments */
import React from 'react';
import medical from '../../img/medical-staff.png';
import users from '../../img/multiple-users-silhouette.png';
import server from '../../img/database.png';
import per from '../../img/dashboard (1).png';
import plus from '../../img/add.png';
import AdminPros from '../glob/AdminPros';
import '../../stylesheets/admin.css';

const Admin = () => {
  return (
    <div className="admin-cont">
      <header className="admin-header">
        <h1>GLOBTHERAPIST</h1>
      </header>
      <div className="admin-body">
        <div className="adim-options-cont">
          <div className="admin-option">
            <div className="admin-option-img-cont">
              <div className="admin-option-img-cont">
                <img className="admin-option-img" src={medical} alt="" />
              </div>
              <div className="plus-cont">
                <img src={plus} alt="" className="plus-img" />
              </div>
            </div>
            <div className="admin-txt-cont">
              <h2>Pros</h2>
            </div>
          </div>
          <div className="admin-option">
            <div className="admin-option-img-cont">
              <div className="admin-option-img-cont">
                <img className="admin-option-img" src={users} alt="" />
              </div>
              <div className="plus-cont">
                <img src={plus} alt="" className="plus-img" />
              </div>
            </div>
            <div className="admin-txt-cont">
              <h2>Users</h2>
            </div>
          </div>
          <div className="admin-option">
            <div className="admin-option-img-cont">
              <div className="admin-option-img-cont">
                <img className="admin-option-img" src={server} alt="" />
              </div>
              <div className="plus-cont">
                <img src={plus} alt="" className="plus-img" />
              </div>
            </div>
            <div className="admin-txt-cont">
              <h2>Servidor</h2>
            </div>
          </div>
          <div className="admin-option">
            <div className="admin-option-img-cont">
              <div className="admin-option-img-cont">
                <img className="admin-option-img" src={per} alt="" />
              </div>
              <div className="plus-cont">
                <img src={plus} alt="" className="plus-img" />
              </div>
            </div>
            <div className="admin-txt-cont">
              <h2>Performance</h2>
            </div>
          </div>
        </div>
        <AdminPros />
      </div>
    </div>
  );
};

export default Admin;
